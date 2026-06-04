import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { Resend } from "npm:resend@4.0.0";

const resendApiKey = Deno.env.get("RESEND_API_KEY");
const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") ?? "onboarding@resend.dev";
const recipientEmail = Deno.env.get("RESEND_TEST_RECIPIENT") ?? "antonio@tonli.dev";

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  if (!resendApiKey) {
    return Response.json(
      { error: "RESEND_API_KEY secret is not configured." },
      { status: 500 },
    );
  }

  const resend = new Resend(resendApiKey);
  const { data, error } = await resend.emails.send({
    from: fromEmail,
    to: recipientEmail,
    subject: "UIO ProPrep — Resend test",
    html: "<p>Čestitamo! Uspješno ste poslali prvi <strong>UIO ProPrep</strong> email putem Resenda.</p>",
  });

  if (error) {
    return Response.json({ error }, { status: 502 });
  }

  return Response.json({ success: true, id: data?.id });
});
