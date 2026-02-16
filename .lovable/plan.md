

## Add Promo Code Support for the Starter Plan

### What You'll Get
A "Have a promo code?" toggle on the Starter plan card. When clicked, it reveals a small input field where users can type their code before checking out. Stripe handles all the validation and discount application on the checkout page.

### How It Works

1. **Frontend (PricingSection.tsx)**: Add a collapsible promo code input under the Starter plan's "Get Starter" button. The entered code is passed along when starting checkout.

2. **Backend (create-checkout edge function)**: When a promo code is provided for the Starter tier, the checkout session is created with `allow_promotion_codes: true`, which shows a pre-filled or editable promo code field on Stripe's checkout page. This way Stripe validates the code -- no custom validation logic needed.

3. **Stripe Dashboard**: You'll create your promo codes directly in Stripe (Coupons section). For example, create a coupon for X% off, then generate a promotion code like "LAUNCH20" tied to that coupon. You can restrict it to the Starter product only if desired.

### Technical Details

**`src/components/PricingSection.tsx`**:
- Add `promoCode` state (string) and `showPromo` toggle (boolean)
- Below the "Get Starter" button, add a small "Have a promo code?" text button
- When toggled, show a compact input field
- Pass `promoCode` to `handleCheckout`
- Update `handleCheckout` to accept and forward the promo code

**`supabase/functions/create-checkout/index.ts`**:
- Parse optional `promoCode` from the request body
- When creating the Stripe checkout session, add `allow_promotion_codes: true` so the promo code field appears on Stripe's checkout page
- This lets Stripe handle all validation (expired codes, wrong product, usage limits, etc.)

### No Database Changes Needed
Promo codes are managed entirely through Stripe. No new tables or migrations required.

