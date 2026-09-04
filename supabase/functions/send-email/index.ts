import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
// Use a verified domain sender once you have one; Resend's test sender works out of the box.
const RESEND_FROM = Deno.env.get("RESEND_FROM") ?? "Creovator <onboarding@resend.dev>";

interface Recipient {
  email: string;
  name?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipients, subject, content, eventId } = await req.json() as {
      recipients: Recipient[];
      subject: string;
      content: string;
      eventId?: string;
    };

    if (!Array.isArray(recipients) || recipients.length === 0 || !subject || !content) {
      return new Response(
        JSON.stringify({ success: false, error: "recipients, subject and content are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "Email service is not configured (missing RESEND_API_KEY)." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Service role client so we can write email_logs regardless of RLS.
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Preserve line breaks from the plain-text content in the HTML body.
    const toHtml = (text: string) =>
      `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#111827;white-space:pre-wrap;">${
        text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      }</div>`;

    let sent = 0;
    let failed = 0;
    const logs: any[] = [];

    for (const r of recipients) {
      if (!r?.email) { failed++; continue; }
      let status = "sent";
      let errorMsg: string | null = null;

      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: RESEND_FROM,
            to: [r.email],
            subject,
            html: toHtml(content),
          }),
        });

        if (!res.ok) {
          status = "failed";
          errorMsg = (await res.text()).slice(0, 500);
          failed++;
        } else {
          sent++;
        }
      } catch (e) {
        status = "failed";
        errorMsg = (e as Error).message;
        failed++;
      }

      logs.push({
        event_id: eventId ?? null,
        recipient_email: r.email,
        recipient_name: r.name ?? null,
        subject,
        status,
        error: errorMsg,
      });
    }

    // Best-effort logging — never fail the request just because logging failed.
    try {
      if (logs.length > 0) await supabase.from("email_logs").insert(logs);
    } catch (_) { /* email_logs table may not exist yet */ }

    return new Response(
      JSON.stringify({ success: true, sent, failed }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message || "Server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
