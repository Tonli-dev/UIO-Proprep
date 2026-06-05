import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

const DAY_MS = 24 * 60 * 60 * 1000;

const packageDurations: Record<string, number | null> = {
  premium_30_days: 30,
  premium_90_days: 90,
  premium_lifetime: null,
};
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, {
    ...init,
    headers: {
      ...corsHeaders,
      "Cache-Control": "no-store",
      ...(init?.headers || {}),
    },
  });
}

function getSecretKey() {
  const legacyServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacyServiceRoleKey) return legacyServiceRoleKey;
  const keys = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (keys) return JSON.parse(keys).default;
  return Deno.env.get("SUPABASE_SECRET_KEY");
}

async function hmacSha256Hex(secret: string, payload: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function secureCompare(first: string, second: string) {
  if (first.length !== second.length) return false;
  let result = 0;
  for (let index = 0; index < first.length; index += 1) {
    result |= first.charCodeAt(index) ^ second.charCodeAt(index);
  }
  return result === 0;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function verifySignature(request: Request, payload: string) {
  const secret = Deno.env.get("LEMON_SQUEEZY_WEBHOOK_SECRET");
  const signature = request.headers.get("x-signature") ?? request.headers.get("X-Signature") ?? "";
  if (!secret || !signature) return false;
  const expected = await hmacSha256Hex(secret, payload);
  return secureCompare(signature, expected);
}

function eventStatus(eventName: string) {
  if (eventName === "order_refunded") return "refunded";
  if (eventName.includes("chargeback") || eventName.includes("dispute")) return "chargeback";
  if (eventName === "order_created") return "paid";
  return null;
}

function getOrderAttributes(payload: any) {
  return payload?.data?.attributes ?? {};
}

function getVariantId(payload: any) {
  const item = getOrderAttributes(payload).first_order_item;
  return String(item?.variant_id ?? item?.variant?.id ?? payload?.meta?.custom_data?.variant_id ?? "");
}

async function recomputeEntitlement(supabaseAdmin: any, userId: string) {
  const { data, error } = await supabaseAdmin
    .from("premium_purchases")
    .select("id, package_id, status, created_at")
    .eq("user_id", userId)
    .eq("status", "paid")
    .order("created_at", { ascending: true });

  if (error) throw error;
  const purchases = data ?? [];
  const now = new Date();
  const hasLifetime = purchases.some((purchase: any) => purchase.package_id === "premium_lifetime");

  if (hasLifetime) {
    await upsertEntitlement(supabaseAdmin, userId, null);
    return;
  }

  let cursor: Date | null = null;
  for (const purchase of purchases) {
    const durationDays = packageDurations[purchase.package_id];
    if (!durationDays) continue;

    const createdAt = new Date(purchase.created_at);
    const startsAt = cursor && cursor > createdAt ? cursor : createdAt;
    const expiresAt = new Date(startsAt.getTime() + durationDays * DAY_MS);
    cursor = expiresAt;

    const { error: updateError } = await supabaseAdmin
      .from("premium_purchases")
      .update({
        starts_at: startsAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", purchase.id);
    if (updateError) throw updateError;
  }

  await upsertEntitlement(supabaseAdmin, userId, cursor && cursor > now ? cursor.toISOString() : "free");
}

async function upsertEntitlement(supabaseAdmin: any, userId: string, expiresAt: string | null) {
  const isFree = expiresAt === "free";
  const { error } = await supabaseAdmin
    .from("entitlements")
    .upsert({
      user_id: userId,
      tier: isFree ? "free" : "premium",
      expires_at: isFree ? null : expiresAt,
      updated_at: new Date().toISOString(),
    });
  if (error) throw error;
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const payloadText = await request.text();
  const signatureOk = await verifySignature(request, payloadText);
  if (!signatureOk) {
    return json({ error: "Bad Lemon Squeezy signature" }, { status: 400 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const secretKey = getSecretKey();
  if (!supabaseUrl || !secretKey) {
    return json({ error: "Supabase admin credentials are not configured." }, { status: 500 });
  }

  const payload = JSON.parse(payloadText);
  const eventName = String(payload?.meta?.event_name ?? "");
  const status = eventStatus(eventName);
  if (!status) return json({ ignored: true, eventName });

  const customData = payload?.meta?.custom_data ?? {};
  const userId = customData.user_id;
  const packageId = customData.package_id;
  if (!userId || !packageDurations.hasOwnProperty(packageId)) {
    return json({ error: "Webhook custom data is missing user_id or package_id." }, { status: 400 });
  }

  const attributes = getOrderAttributes(payload);
  const providerOrderId = String(payload?.data?.id ?? attributes.order_number ?? "");
  if (!providerOrderId) {
    return json({ error: "Webhook order id is missing." }, { status: 400 });
  }

  const supabaseAdmin = createClient(supabaseUrl, secretKey);
  const paidAt = new Date().toISOString();
  const { error: upsertError } = await supabaseAdmin
    .from("premium_purchases")
    .upsert({
      user_id: userId,
      provider: "lemon_squeezy",
      provider_order_id: providerOrderId,
      provider_variant_id: getVariantId(payload),
      package_id: packageId,
      status,
      amount: Number(attributes.total ?? attributes.subtotal ?? 0),
      currency: String(attributes.currency ?? "BAM").toUpperCase(),
      raw_event: payload,
      updated_at: paidAt,
    }, { onConflict: "provider,provider_order_id" });

  if (upsertError) {
    return json({ error: "Premium purchase could not be stored.", details: upsertError.message }, { status: 500 });
  }

  try {
    await recomputeEntitlement(supabaseAdmin, userId);
  } catch (error) {
    return json({ error: "Entitlement recompute failed.", details: errorMessage(error) }, { status: 500 });
  }

  return json({ received: true, eventName, status });
});
