import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

const appUrl = Deno.env.get("PUBLIC_APP_URL") ?? "https://carina.tonli.dev";
const lemonApiKey = Deno.env.get("LEMON_SQUEEZY_API_KEY");
const lemonStoreId = Deno.env.get("LEMON_SQUEEZY_STORE_ID");
const lemonTestMode = Deno.env.get("LEMON_SQUEEZY_TEST_MODE") === "true";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const packages = {
  premium_30_days: {
    label: "UIO ProPrep Premium 30 dana",
    variantId: Deno.env.get("LEMON_SQUEEZY_VARIANT_30_DAYS"),
  },
  premium_90_days: {
    label: "UIO ProPrep Premium 90 dana",
    variantId: Deno.env.get("LEMON_SQUEEZY_VARIANT_90_DAYS"),
  },
  premium_lifetime: {
    label: "UIO ProPrep Premium zauvijek",
    variantId: Deno.env.get("LEMON_SQUEEZY_VARIANT_LIFETIME"),
  },
} as const;

type PackageId = keyof typeof packages;

function getPublishableKey() {
  const legacyAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (legacyAnonKey) return legacyAnonKey;
  const keys = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS");
  if (keys) return JSON.parse(keys).default;
  return Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
}

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

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  if (!lemonApiKey || !lemonStoreId) {
    return json({ error: "Lemon Squeezy secrets are not configured." }, { status: 500 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = getPublishableKey();
  const authorization = request.headers.get("Authorization") ?? "";
  if (!supabaseUrl || !supabaseKey || !authorization) {
    return json({ error: "Supabase auth is not configured." }, { status: 401 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: authorization } },
  });
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return json({ error: "Prijavite se prije kupovine premium pristupa." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const packageId = body.packageId as PackageId;
  const selectedPackage = packages[packageId];
  if (!selectedPackage?.variantId) {
    return json({ error: "Odabrani premium paket nije dostupan." }, { status: 400 });
  }

  const returnUrl = new URL("/", appUrl);
  returnUrl.searchParams.set("checkout", "success");
  const cancelUrl = new URL("/", appUrl);
  cancelUrl.searchParams.set("checkout", "cancelled");

  const checkoutResponse = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
    method: "POST",
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${lemonApiKey}`,
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          product_options: {
            name: selectedPackage.label,
            redirect_url: returnUrl.toString(),
            receipt_button_text: "Vrati se u UIO ProPrep",
            receipt_link_url: returnUrl.toString(),
          },
          checkout_options: {
            embed: false,
            media: false,
          },
          checkout_data: {
            email: userData.user.email,
            custom: {
              user_id: userData.user.id,
              package_id: packageId,
              content_version: body.contentVersion ?? null,
              cancel_url: cancelUrl.toString(),
            },
          },
          test_mode: lemonTestMode,
        },
        relationships: {
          store: {
            data: { type: "stores", id: lemonStoreId },
          },
          variant: {
            data: { type: "variants", id: selectedPackage.variantId },
          },
        },
      },
    }),
  });

  const checkout = await checkoutResponse.json().catch(() => null);
  if (!checkoutResponse.ok) {
    return json({ error: "Lemon Squeezy checkout nije kreiran.", details: checkout }, { status: 502 });
  }

  return json({
    checkoutUrl: checkout?.data?.attributes?.url,
    packageId,
  });
});
