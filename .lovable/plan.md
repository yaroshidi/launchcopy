

# Content Preferences: Popover + Selected Tags

Convert the "Customize content style" section from an inline expanding panel into a compact popover, and show the currently selected preferences as small chips/tags beneath the input field for at-a-glance visibility.

---

## Current Behavior

- Clicking "Customize content style" expands a full-width panel inline with framer-motion animation
- The panel contains 4 select dropdowns in a 2x2 grid
- When collapsed, there is no indication of what preferences are currently active

## New Behavior

- Clicking "Customize content style" opens a **Popover** (floating panel) anchored to the button
- The 4 select dropdowns remain inside this popover
- Below the main URL input bar, small **chips/tags** display the currently selected values (e.g., `Professional`, `Developers`, `General`, `Friendly`)
- Chips are always visible so the user can see their active preferences without opening the popover
- Only non-default values could be highlighted differently (subtle accent) to draw attention to customized settings

---

## Files to Change

### 1. `src/components/ContentPreferences.tsx`

- Replace the `AnimatePresence` / `motion.div` expanding panel with a `Popover` + `PopoverTrigger` + `PopoverContent` from `@/components/ui/popover`
- The trigger button stays the same visually (Settings2 icon + "Customize content style" text) but now toggles a popover instead of expanding inline
- Move the 4 select dropdowns inside `PopoverContent` with a wider width (`w-80` or `w-96`) so they fit comfortably
- Remove the framer-motion import (no longer needed)
- Remove the `isExpanded` state (popover manages its own open/close)

### 2. `src/components/RepoInput.tsx`

- After the main URL input bar (the `glass-card` div), add a row of small chips showing the current preference selections
- Each chip displays: the label of the currently selected value for each preference category (Tone, Audience, Industry, Voice)
- Chips use small rounded pill styling: `text-xs px-2 py-0.5 rounded-full bg-secondary/60 text-muted-foreground border border-border/30`
- The chips row sits between the input bar and the "Customize content style" button
- Import the option label arrays from `ContentPreferences` (or define a small helper map) to convert values like `'professional'` to display labels like `Professional`

---

## Technical Details

### `src/components/ContentPreferences.tsx`

- Remove imports: `useState`, `motion`, `AnimatePresence`, `ChevronDown`, `ChevronUp`
- Add imports: `Popover`, `PopoverTrigger`, `PopoverContent` from `@/components/ui/popover`
- Export the option arrays (`TONE_OPTIONS`, `AUDIENCE_OPTIONS`, `INDUSTRY_OPTIONS`, `VOICE_OPTIONS`) so `RepoInput` can look up labels
- The trigger button keeps `Settings2` icon and text, styled the same
- `PopoverContent` gets `className="w-80 sm:w-96"` and `align="start"` so it opens left-aligned below the trigger
- The 4 select dropdowns stay in a 2-column grid inside the popover
- Remove the "These preferences will tailor..." footer text to keep the popover compact

### `src/components/RepoInput.tsx`

- Import the exported option arrays from `ContentPreferences`
- Add a helper function to look up display labels from preference values
- Add a `<div className="flex flex-wrap gap-1.5">` between the input bar and the ContentPreferences component
- Render 4 chips, one per preference, each showing the current selection's label
- Chip styling: subtle background, small text, rounded pill shape

### Layout Order (inside the form)

1. URL input bar (glass-card)
2. Selected preferences chips row (new)
3. "Customize content style" popover trigger + popover (moved below chips)
4. "Have a private repo?" toggle
5. Helper text

