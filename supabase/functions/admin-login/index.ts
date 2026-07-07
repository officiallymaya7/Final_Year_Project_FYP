import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return new Response(
        JSON.stringify({ success: false, error: "Username and password required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Service role key use kar rahe hain kyunke RLS ke wajah se
    // normal client admins table read nahi kar sakta
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Password verify karne ke liye Postgres ke crypt() function ko
    // ek RPC ke zariye call karenge (neeche Step 2b mein banayenge)
    const { data, error } = await supabase.rpc("verify_admin_login", {
      p_username: username,
      p_password: password,
    });

    if (error || !data || data.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid username or password" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const admin = data[0];
    return new Response(
      JSON.stringify({ success: true, admin: { id: admin.id, username: admin.username } }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: "Server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});