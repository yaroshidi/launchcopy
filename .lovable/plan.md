

# Homepage Redesign -- Centered Hero Layout

Taking cues from the design inspirations (Maskara.ai, Pencil, OpenAI), we'll shift from the current asymmetric split-screen to a bold, centered hero that puts the input front and center with the showcase flowing naturally below it.

## What Changes

### 1. Centered Hero Layout
Switch from the current 2-column grid to a single-column, vertically-stacked, centered layout:
- Large, bold headline centered on the page
- Subtitle text centered below
- Repo input centered and prominent
- Suggestion chips (example repos) below the input -- inspired by Maskara.ai's suggestion pills
- Social proof strip centered below

### 2. Bolder Typography
- Increase headline size: bump to `text-5xl sm:text-6xl lg:text-7xl`
- Tighter tracking and stronger weight
- Keep the gradient accent on the key word "story"
- Subtitle becomes a single clean line, centered

### 3. Suggestion Chips
Add clickable example repo pills below the input (like Maskara.ai's "generate an agent for tweet every monday" chips). These will pre-fill the URL input when clicked:
- "vercel/next.js"
- "shadcn-ui/ui"  
- "supabase/supabase"
These give users an instant way to try the tool and show what kind of repos work.

### 4. ContentShowcase Repositioned
Move the rotating content showcase from the right column to a full-width section below the hero fold. It becomes a "See what we generate" showcase area -- wider, more impactful, centered.

### 5. Cleaner Spacing and Background
- More vertical breathing room (generous padding top/bottom)
- Remove the `min-h-screen` constraint on the hero -- let content flow naturally
- Add a subtle radial gradient glow behind the headline area for depth (like Maskara.ai's soft color wash)
- The ContentShowcase section gets its own visual separation

### 6. Navbar Polish
Add a subtle CTA or "How it works" link to the navbar alongside the GitHub icon.

---

## Technical Details

### File: `src/components/Hero.tsx`
- Remove the `grid grid-cols-1 lg:grid-cols-2` layout
- Replace with a single centered column: `flex flex-col items-center text-center`
- Increase heading font sizes to `text-5xl sm:text-6xl lg:text-7xl`
- Center the subtitle paragraph with `text-center max-w-2xl mx-auto`
- Center the `RepoInput` with `max-w-2xl w-full mx-auto`
- Add a new "suggestion chips" section: a `flex flex-wrap justify-center gap-2` row of clickable pills that each pre-fill the input with an example GitHub URL
- Center the social proof strip
- Remove the `hidden lg:block` ContentShowcase from inside the hero
- Add a subtle radial gradient pseudo-element behind the heading for a soft glow effect
- Change section from `min-h-screen` to `pt-32 pb-16` for controlled spacing

### File: `src/components/RepoInput.tsx`
- Accept an optional `suggestedUrl` prop or expose a way for the parent to set the URL
- Add a `setUrl` callback or lift state so suggestion chips can pre-fill the input
- Alternatively, the chips can be inside RepoInput itself -- add an `examples` array rendered as small pill buttons below the main input bar

### File: `src/components/ContentShowcase.tsx`
- No major changes to the component itself (keep the polished container, rotating tabs, progress bar)
- It will now be rendered in a separate section below the hero rather than side-by-side

### File: `src/pages/Index.tsx`
- After the Hero section, add a new centered section for the ContentShowcase
- Wrap it in a container with a heading like "See what we generate" or keep it minimal
- Add `max-w-3xl mx-auto` to size it nicely in the centered layout

### File: `src/components/Navbar.tsx`
- Add a "How it works" text link next to the GitHub icon for a bit more substance in the nav

### File: `src/index.css`
- Add a subtle radial gradient utility class for the hero background glow effect: a soft, large, centered radial gradient using primary/accent colors at very low opacity

### Visual Layout (top to bottom)

```text
+--------------------------------------------------+
|  Navbar: [RepoToContent]     [How it works] [GH]  |
+--------------------------------------------------+
|                                                    |
|              (subtle radial glow)                  |
|                                                    |
|            Your repo already has a                 |
|                  story.                            |
|           We help you tell it.                     |
|                                                    |
|    Drop a GitHub URL -- our AI reads the code...   |
|                                                    |
|    +------------------------------------------+    |
|    | [GH icon]  github.com/owner/repo  [Analyze]|  |
|    +------------------------------------------+    |
|                                                    |
|    [Customize content style]                       |
|                                                    |
|    [vercel/next.js] [shadcn-ui/ui] [supabase/...]  |
|                                                    |
|       [avatars] 2,400+ repos analyzed              |
|                                                    |
+--------------------------------------------------+
|                                                    |
|        See what we generate                        |
|                                                    |
|    +------------------------------------------+    |
|    | [Social Posts] [Blog] [Case Studies]      |    |
|    |------------------------------------------|    |
|    |                                          |    |
|    |     (rotating content cards)             |    |
|    |                                          |    |
|    +------------------------------------------+    |
|                                                    |
+--------------------------------------------------+
```

