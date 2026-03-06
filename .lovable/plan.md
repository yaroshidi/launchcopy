

## Plan: Grant bonus scan on upgrade + rescan existing free-tier scans

### Problem
1. When a free user upgrades to Starter, they've already used their 1 free scan today, so scan_logs blocks them from scanning again until tomorrow.
2. Free-tier scans only generate 1 item per category (social/blog/case study). After upgrading, users should be able to rescan those repos to get full content.

### Fix 1: Build errors (prerequisite)
- Replace `npm:@supabase/supabase-js@2.57.2` with `https://esm.sh/@supabase/supabase-js@2.49.1` in 4 edge functions: `create-checkout`, `customer-portal`, `get-subscription-details`, `regenerate-content`, `analyze-repo`.
- Fix `error` type in `admin-create-subscription/index.ts` line 38: cast to `(error as Error).message`.

### Fix 2: Reset scan counter on tier upgrade
In `src/contexts/AuthContext.tsx`, track the previous tier. When tier changes from `free` to a paid tier, delete today's scan_logs so the user gets a fresh allowance.

- Add a helper in `src/lib/scanLimits.ts`: `clearTodayScans()` that deletes the user's scan_logs for today.
- In `AuthContext.checkSubscription`, after setting the new tier, compare with previous tier. If upgrading from free → paid, call `clearTodayScans()`.

### Fix 3: "Rescan" button on existing scans
In `src/pages/MyScans.tsx`, add a "Rescan" button on each scan card (visible to Starter+ users). Clicking it navigates to the home page and triggers `handleAnalyze` with the same repo URL. This re-runs the full analysis with the user's current tier (which means the AI prompt generates more content).

Implementation:
- Add a `RescanButton` or icon button on each scan card in MyScans.
- On click, store the repo URL in sessionStorage and navigate to `/` where the Hero component picks it up and auto-triggers analysis.
- Alternatively, simpler: navigate to `/?rescan=SCAN_ID`, and in Index.tsx, detect this param, load the analysis's repo URL, and call `handleAnalyze`.

### Technical details

**scanLimits.ts changes:**
```typescript
export async function clearTodayScans(): Promise<void> {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  await supabase
    .from('scan_logs')
    .delete()
    .gte('scanned_at', today.toISOString());
}
```

Note: RLS on scan_logs doesn't allow DELETE. We need a migration to add a DELETE policy: `auth.uid() = user_id`.

**AuthContext tier change detection:**
- Use a ref to track previous tier, call `clearTodayScans()` when upgrading.

**MyScans rescan flow:**
- Store `{rescanUrl: repoUrl}` in sessionStorage, navigate to `/`.
- In Index.tsx `useEffect`, check for `rescanUrl`, clear it, and call `handleAnalyze`.

### Summary of changes
1. Fix build errors in 5 edge functions (npm import → esm.sh import) + type fix
2. DB migration: add DELETE RLS policy on `scan_logs`
3. `scanLimits.ts`: add `clearTodayScans()`
4. `AuthContext.tsx`: detect tier upgrade, clear today's scans
5. `MyScans.tsx`: add rescan button per scan card
6. `Index.tsx`: handle rescan trigger from MyScans navigation

