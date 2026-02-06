

# Make Preference Chips Clickable (Cycle on Click)

Turn each preference chip below the input field into an interactive button that cycles through its options on click, so users can quickly change preferences without opening the popover.

---

## How It Works

Each chip (Tone, Audience, Industry, Voice) becomes a clickable button. Clicking it advances to the next option in the list, wrapping back to the first option after the last one. This gives a fast, one-click way to swap preferences directly from the chip row.

For example, clicking the "Professional" tone chip cycles it to "Casual", then "Technical", then "Playful", then "Enterprise", then back to "Professional".

The "Customize content style" popover remains available for users who want to see all options at once.

---

## File Changes

### `src/components/RepoInput.tsx`

- Restructure the `chips` array to include the preference key and corresponding options array alongside the label and default status
- Change each chip from a `<span>` to a `<button>` element
- On click, find the current value's index in the options array, advance to the next index (wrapping with modulo), and call `setPreferences` with the new value
- Add `cursor-pointer` and hover styling to make the interactive nature clear
- Add a small visual hint (e.g., subtle rotate or arrow icon) so users know the chips are tappable
- Disable clicking when `isLoading` is true

### Updated chip data structure

```text
chips = [
  { key: 'tone',     options: TONE_OPTIONS,     current: preferences.tone     },
  { key: 'audience', options: AUDIENCE_OPTIONS,  current: preferences.audience },
  { key: 'industry', options: INDUSTRY_OPTIONS,  current: preferences.industry },
  { key: 'voice',    options: VOICE_OPTIONS,     current: preferences.voice    },
]
```

### Click handler logic

```text
function cyclePreference(key, options, currentValue):
  currentIndex = options.findIndex(o => o.value === currentValue)
  nextIndex = (currentIndex + 1) % options.length
  setPreferences({ ...preferences, [key]: options[nextIndex].value })
```

### Styling updates

- Change `<span>` to `<button type="button">`
- Add `cursor-pointer hover:border-primary/50 hover:bg-primary/10` for interactive feedback
- Keep the existing default vs. customized color distinction
- Add `disabled:opacity-50 disabled:cursor-not-allowed` for loading state

---

## No other files change

The `ContentPreferences.tsx` popover stays as-is for full control. This only modifies `RepoInput.tsx` to make the chips interactive.
