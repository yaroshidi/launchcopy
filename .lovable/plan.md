

# Fix: "Invalid time value" in check-subscription

## Root Cause
Line 62 of `check-subscription/index.ts` does:
```
new Date(sub.current_period_end * 1000).toISOString()
```
With the Stripe API version `2025-08-27.basil`, the `current_period_end` property may be `null`, `undefined`, or in a different format than expected. Multiplying `undefined * 1000` produces `NaN`, and `new Date(NaN).toISOString()` throws "Invalid time value."

Since this function is called every 60 seconds while you're logged in, it produces a constant stream of 500 errors.

## Fix
Add a safety check around the date conversion so it gracefully falls back to `null` instead of crashing:

**File: `supabase/functions/check-subscription/index.ts`**

- Wrap the `subscriptionEnd` assignment in a try/catch or null-check
- If `current_period_end` is falsy or produces an invalid date, set `subscriptionEnd` to `null` instead of throwing
- The function will still correctly return `subscribed: true` even if the end date can't be parsed

## Technical Detail

Replace the date conversion block (lines 60-64) with:

```text
if (hasActiveSub) {
  const sub = subscriptions.data[0];
  try {
    const endVal = sub.current_period_end;
    if (endVal) {
      const endMs = typeof endVal === 'number' ? endVal * 1000 : Date.parse(String(endVal));
      if (!isNaN(endMs)) {
        subscriptionEnd = new Date(endMs).toISOString();
      }
    }
  } catch {
    // ignore date parse errors
  }
  logStep("Active subscription found", { end: subscriptionEnd });
}
```

This handles three cases:
1. `current_period_end` is a Unix timestamp (number) -- multiplies by 1000
2. `current_period_end` is an ISO date string -- parses it directly
3. `current_period_end` is null/undefined/unparseable -- gracefully returns null

Single file change, then redeploy the function.

