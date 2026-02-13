

## Fix: Persistent "Token Expired" Errors on Subscription Check

### Problem
The `check-subscription` edge function keeps failing with "Authentication error: invalid JWT: token is expired" because:

1. **Race condition on mount**: Both `onAuthStateChange` and `getSession()` fire simultaneously, sometimes sending a stale token.
2. **Polling with stale tokens**: The 60-second interval can fire right when Supabase is mid-refresh of an expired access token.
3. **No fresh session fetch**: `checkSubscription()` relies on `supabase.functions.invoke()` which uses whatever token is currently cached, even if expired.
4. **Edge function returns 500 for expired tokens**: Instead of returning `{ subscribed: false }` gracefully, it throws a 500 error that surfaces as a scary runtime error.

### Solution (Two-Part Fix)

**Part 1 -- Frontend (`AuthContext.tsx`)**
- Before calling `check-subscription`, fetch a fresh session via `supabase.auth.getSession()`. If there's no valid session, skip the call entirely.
- Remove the duplicate `getSession` + `onAuthStateChange` double-fire pattern. Only call `checkSubscription` from `onAuthStateChange` (which already fires on initial load).
- Silently swallow subscription check errors instead of letting them bubble up as runtime errors.

**Part 2 -- Edge Function (`check-subscription/index.ts`)**
- When the JWT is expired/invalid, return `{ subscribed: false }` with a 200 status instead of throwing a 500 error. An expired token simply means we can't verify the user -- treat it as "not subscribed" rather than a server error.

### Technical Details

**`src/contexts/AuthContext.tsx` changes:**
- Update `checkSubscription` to call `supabase.auth.getSession()` first and bail out if no valid session exists.
- Remove the `checkSubscription()` call from the `getSession().then()` block (the `onAuthStateChange` listener already handles initial load).
- Wrap the invoke call in a try/catch that silently logs instead of surfacing errors.

**`supabase/functions/check-subscription/index.ts` changes:**
- In the catch block, if the error message contains "expired" or "invalid JWT", return a 200 with `{ subscribed: false }` instead of a 500 error.
- This ensures even if a stale token slips through, the user sees no error -- just a graceful fallback to "free" tier.

