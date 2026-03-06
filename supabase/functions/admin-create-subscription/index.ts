import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });
    const { customer_id, price_id } = await req.json();

    // Cancel any existing incomplete subscriptions first
    const existing = await stripe.subscriptions.list({ customer: customer_id, status: "incomplete", limit: 10 });
    for (const sub of existing.data) {
      await stripe.subscriptions.cancel(sub.id);
    }

    // Create with a long trial so no payment method is needed
    const trialEnd = Math.floor(Date.now() / 1000) + (5 * 365 * 24 * 60 * 60); // ~5 years
    const subscription = await stripe.subscriptions.create({
      customer: customer_id,
      items: [{ price: price_id }],
      trial_end: trialEnd,
      payment_behavior: "allow_incomplete",
      trial_settings: { end_behavior: { missing_payment_method: "cancel" } },
    });

    return new Response(JSON.stringify({ id: subscription.id, status: subscription.status }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
