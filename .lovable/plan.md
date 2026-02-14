
## Fix: Scans Not Saving to Your Account

### Root Cause
The function that saves scan results to the database is missing the required `user_id` field. Since the column is NOT NULL, every save attempt silently fails. The scan you see on the home page lives only in temporary browser storage (sessionStorage), which is why the Dashboard page shows "No scans yet."

### The Fix

**File: `src/lib/api.ts` -- `saveAnalysis` function**

Add the authenticated user's ID to the database insert:

```typescript
export async function saveAnalysis(
  analysis: RepoAnalysis,
  preferences?: ContentPreferences
): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('analyses')
    .insert({
      user_id: user.id,          // <-- THE MISSING FIELD
      repo_url: analysis.repoUrl,
      summary: analysis.summary,
      content: analysis.content,
      // ... rest unchanged
    })
    .select('id')
    .single();
  // ...
}
```

### What This Fixes
- Scans will actually persist to the database under your user account.
- The Dashboard (/my-scans) will correctly list all your past scans.
- Scans will survive browser restarts and work across devices.

### No Database Changes Needed
The table schema and RLS policies are already correct -- the bug is purely in the frontend code missing the `user_id` value on insert.
