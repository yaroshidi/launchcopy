

# Add Starter Plan ($10/month)

## Overview
Add a middle "Starter" tier between Free and Pro, priced at $10/month. Starter users get more than free users but less than Pro.

## Starter Plan Limits
- **5 repository scans** (Free = 1, Pro = unlimited)
- **3 social posts per scan** (Free = 1, Pro = unlimited)
- **2 blog articles per scan** (Free = 1, Pro = unlimited)
- **2 case studies per scan** (Free = 1, Pro = unlimited)
- **Export and copy content** (Free = no)
- **Regenerate with preferences** (no, Pro only)

## Changes

### 1. Create Stripe Product + Price
Use Stripe tools to create a "LaunchCopy Starter" product at $10/month recurring.

### 2. Add Tier Constants
Create `src/lib/tiers.ts` with a shared tier map:
```text
tiers = {
  starter: { price_id: "<new_price>", product_id: "<new_product>", scanLimit: 5, contentLimits: { social: 3, blog: 2, caseStudy: 2 } },
  pro:     { price_id: "price_1SzRykG4j3t2B4Q9RAjh4f0D", product_id: "prod_TxMijV21gbwIgp", scanLimit: Infinity, contentLimits: null },
}
```

### 3. AuthContext: Track Subscription Tier
- Replace the boolean `isPro` with a `tier` field: `'free' | 'starter' | 'pro'`
- Keep `isPro` as a computed convenience (`tier === 'pro'`)
- Add `isStarter` convenience (`tier === 'starter'`)
- Update `check-subscription` response parsing to read `product_id` and map it to a tier

### 4. Backend: `check-subscription` Edge Function
- Return the `product_id` from the active subscription (it already has the logic but wasn't exposing it consistently)
- Frontend maps product_id to tier name

### 5. Backend: `create-checkout` Edge Function
- Accept a `tier` parameter in the request body (`'starter'` or `'pro'`)
- Use the corresponding price_id from a server-side tier map
- Default to starter if not specified

### 6. Backend: `analyze-repo` Content Gating
- Currently: free users get 1 scan, `isPro` users get unlimited
- New logic: look up user's product_id from Stripe to determine tier
- Starter: allow up to 5 scans; truncate content beyond index limits (3 social, 2 blog, 2 case study)
- Pro: unchanged (unlimited everything)
- Free: unchanged (1 scan, 1 item per category)

### 7. Backend: `regenerate-content` Edge Function
- Currently blocks all non-Pro users
- Allow Starter users to regenerate as well (they paid, they should get regeneration)
- Actually, per the plan features, regeneration is Pro-only. Keep the block for Starter.

### 8. Frontend: `PricingSection.tsx`
- Change grid from 2 columns to 3 columns
- Add Starter card in the middle with its feature list
- Starter button calls `create-checkout` with `tier: 'starter'`
- Update button logic to show "Current plan" for the user's active tier

### 9. Frontend: `LockedContentOverlay.tsx`
- Update copy to mention both tiers with their prices
- For Starter users, show "Upgrade to Pro" messaging instead of the full lock

### 10. Frontend: `Index.tsx` Scan Limit
- Update the client-side scan limit check: Starter users get 5 scans, not 1

## Technical Details

**Tier mapping (shared between frontend and backend):**
```text
product_id -> tier name:
  prod_TxMijV21gbwIgp -> "pro"
  <new_product_id>   -> "starter"
  (no subscription)  -> "free"
```

**Content gating logic in analyze-repo:**
```text
if tier == "free":
  keep 1 item per category, truncate rest
elif tier == "starter":
  keep 3 social, 2 blog, 2 case study, truncate rest
else (pro):
  keep everything
```

**Scan limit logic in analyze-repo:**
```text
if tier == "free": limit = 1
elif tier == "starter": limit = 5
else: no limit
```

**Files to create:**
- `src/lib/tiers.ts`

**Files to modify:**
- `src/contexts/AuthContext.tsx`
- `src/components/PricingSection.tsx`
- `src/components/LockedContentOverlay.tsx`
- `src/pages/Index.tsx`
- `supabase/functions/create-checkout/index.ts`
- `supabase/functions/check-subscription/index.ts`
- `supabase/functions/analyze-repo/index.ts`
