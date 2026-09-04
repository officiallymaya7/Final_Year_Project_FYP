// Creates a PayFast (Pakistan) hosted-checkout session.
//
// Flow: the frontend calls this function with the amount + buyer details. We ask
// PayFast for a one-time ACCESS_TOKEN and hand back the fields the browser needs
// to POST the shopper to PayFast's secure payment page. PayFast then redirects the
// shopper back to SUCCESS_URL / FAILURE_URL on the payment page.
//
// Required secrets (set with `supabase secrets set`):
//   PAYFAST_MERCHANT_ID     - your PayFast merchant id
//   PAYFAST_SECURED_KEY     - your PayFast secured key
//   PAYFAST_MERCHANT_NAME   - display name (optional, defaults to "Creovator")
//   PAYFAST_MODE            - "sandbox" (default) or "production"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MODE = Deno.env.get("PAYFAST_MODE") ?? "sandbox";
const BASE = MODE === "production"
  ? "https://ipg1.apps.net.pk"
  : "https://ipguat.apps.net.pk";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount, basketId, email, phone } = await req.json() as {
      amount: number | string;
      basketId: string;
      email?: string;
      phone?: string;
    };

    if (!amount || !basketId) {
      return new Response(
        JSON.stringify({ success: false, error: "amount and basketId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const merchantId = Deno.env.get("PAYFAST_MERCHANT_ID");
    const securedKey = Deno.env.get("PAYFAST_SECURED_KEY");
    const merchantName = Deno.env.get("PAYFAST_MERCHANT_NAME") ?? "Creovator";

    // Not configured yet — tell the client honestly instead of faking a charge.
    if (!merchantId || !securedKey) {
      return new Response(
        JSON.stringify({ success: false, notConfigured: true, error: "Payment gateway is not configured yet." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Request a one-time access token from PayFast.
    const tokenRes = await fetch(`${BASE}/Ecommerce/api/Transaction/GetAccessToken`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        MERCHANT_ID: merchantId,
        SECURED_KEY: securedKey,
        BASKET_ID: basketId,
        TXNAMT: String(amount),
      }),
    });

    const tokenText = await tokenRes.text();
    let token = "";
    try {
      token = JSON.parse(tokenText)?.ACCESS_TOKEN ?? "";
    } catch {
      token = new URLSearchParams(tokenText).get("ACCESS_TOKEN") ?? "";
    }

    if (!tokenRes.ok || !token) {
      return new Response(
        JSON.stringify({ success: false, error: "Could not start the payment session with PayFast." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Return the token + everything the browser needs to POST to the checkout page.
    return new Response(
      JSON.stringify({
        success: true,
        token,
        merchantId,
        merchantName,
        basketId,
        amount: String(amount),
        currency: "PKR",
        email: email ?? "",
        phone: phone ?? "",
        postUrl: `${BASE}/Ecommerce/api/Transaction/PostTransaction`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message || "Server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
