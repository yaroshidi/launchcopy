

# Persist Analysis Across Auth Flow

When a user analyzes a repo and then signs up, they should return to their analysis results with the content unlocked, not the empty homepage.

---

## The Problem

The analysis data lives in React state inside `Index.tsx`. When the user clicks "Sign up to unlock" and navigates to `/auth`, the Index component unmounts and the analysis state is lost. After signing in, they're sent back to `/` with no analysis to show.

## The Solution

Save the analysis data to `sessionStorage` whenever an analysis completes, and restore it when the Index page mounts. This way the analysis survives navigation to `/auth` and back.

---

## Changes

### 1. `src/pages/Index.tsx` -- Save and restore analysis

- On successful analysis, save the result (plus the repo URL and preferences) to `sessionStorage`
- On component mount, check `sessionStorage` for a saved analysis and restore it into state
- On "New Analysis" (back button), clear sessionStorage so the user starts fresh
- Serialize the `analyzedAt` Date properly

### 2. `src/components/LockedContentOverlay.tsx` -- No changes needed

The overlay already links to `/auth`. Once the user signs in and returns to `/`, the restored analysis + authenticated state will automatically unlock the content.

### 3. `src/pages/Auth.tsx` -- No changes needed

It already redirects authenticated users to `/` with `<Navigate to="/" replace />`. The Index page will pick up the saved analysis from sessionStorage.

---

## Technical Details

### sessionStorage key and structure

A single key `repo_analysis` stores a JSON object:

```text
{
  analysis: RepoAnalysis (with analyzedAt as ISO string),
  repoUrl: string,
  preferences: ContentPreferences | undefined
}
```

### Save logic (in Index.tsx handleAnalyze)

After `setAnalysis(result)` succeeds, write to sessionStorage:

```text
sessionStorage.setItem('repo_analysis', JSON.stringify({
  analysis: result,
  repoUrl: url,
  preferences
}));
```

### Restore logic (in Index.tsx, on mount via useState initializer or useEffect)

```text
useState(() => {
  const saved = sessionStorage.getItem('repo_analysis');
  if (saved) {
    const parsed = JSON.parse(saved);
    parsed.analysis.analyzedAt = new Date(parsed.analysis.analyzedAt);
    return parsed.analysis;
  }
  return null;
});
```

Also restore `currentRepoUrl` and `lastPreferences` from the same saved data.

### Clear logic (in handleBack)

```text
sessionStorage.removeItem('repo_analysis');
setAnalysis(null);
```

### Files modified

| File | What changes |
|------|-------------|
| `src/pages/Index.tsx` | Add sessionStorage save on analysis, restore on mount, clear on back |

No other files need changes. The existing auth redirect and unlock logic handle the rest automatically.

