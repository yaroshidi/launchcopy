
# Deep Source Code Scanning for Accurate Content Generation

## Problem

The analysis engine currently relies heavily on the README file and only skims 3 top-level source files. When the README is outdated or inaccurate, the generated content doesn't reflect what the app actually does. The source code -- which is the truth -- is barely read.

## What Changes

The context-gathering step in the backend function will be upgraded to recursively scan the repository's source code, intelligently selecting the most informative files to read. This gives the AI a much richer understanding of what the project actually does.

## How It Works

### 1. Recursive Directory Tree (new)

Instead of only listing the root of `src/`, the function will recursively fetch up to 3 levels deep across key directories (`src/`, `lib/`, `app/`, `pages/`, `routes/`, `api/`, `components/`). This builds a complete picture of the project structure.

### 2. Smart File Selection (new)

Not all files are equally informative. The function will prioritize reading files that reveal functionality:

**High-priority files** (read first, up to 3000 chars each):
- Entry points: `index.ts`, `main.ts`, `App.tsx`, `app.ts`
- Route definitions: files in `routes/`, `pages/`, or containing "route" in the name
- API handlers: files in `api/`, `handlers/`, `controllers/`
- Configuration: `config.ts`, `constants.ts`, `.env.example`

**Medium-priority files** (read next, up to 2000 chars each):
- Component files in `components/` (sample up to 5)
- Hook/utility files in `hooks/`, `utils/`, `lib/`
- Database/model files: `schema.ts`, `models/`, `types/`

**Low-priority files** (structure only, not read):
- Test files, style files, generated files

### 3. Budget-Aware Reading

The function will track total context size and stop reading once it hits ~30,000 characters (up from the current ~15,000). This keeps the AI request fast while providing 2x more signal.

### 4. File Tree in Context

The full directory tree (up to 3 levels) will be included in the context so the AI can see the overall architecture even for files it didn't read. Seeing `src/components/Dashboard.tsx`, `src/pages/Auth.tsx`, `src/lib/api.ts` tells the AI a lot even without reading those files.

## Technical Details

### File: `supabase/functions/analyze-repo/index.ts`

**New helper function: `fetchDirRecursive`**
- Recursively fetches directory contents from GitHub API up to a specified depth
- Returns a flat list of all files with their full paths
- Respects rate limits by capping total API calls at ~15

**Updated `gatherRepoContext` function:**
- Replace the current single-directory scan (lines 174-193) with the recursive approach
- Add a priority scoring system for file selection
- Read 10-15 source files instead of 3, selected by priority
- Include the full directory tree listing in context output
- Track character budget to avoid oversized prompts

**Changes to existing sections:**
- Section 6 (source folder scan) will be completely rewritten
- A new Section 6b (smart file reading) will be added
- The directory structure section (Section 5) will show the full recursive tree instead of just root files

### Estimated API calls per analysis
- Current: ~8-10 GitHub API calls
- New: ~20-25 GitHub API calls (still well within rate limits)

### No frontend changes needed
This is entirely a backend improvement. The same UI displays the results -- they'll just be more accurate and specific.
