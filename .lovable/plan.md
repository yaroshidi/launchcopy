

## Full Color Rebrand: #80ed99 Green Identity

### Overview
Replace all blue (#0EA5E9 / hsl 199 89% 48%) and purple (#7C3AED / hsl 262 83% 58%) with a cohesive color palette built around #80ed99 (a fresh mint green).

`#80ed99` in HSL is approximately `140 80% 71%`. The palette will use this as the base, with a deeper green for accents and a darker shade for gradient endpoints -- no purple, no blue.

### New Color Palette

| Role | Old HSL | New HSL | Hex |
|------|---------|---------|-----|
| Primary | 199 89% 48% (cyan-blue) | 150 84% 40% (rich green) | ~#10B981 |
| Accent | 262 83% 58% (purple) | 140 80% 71% (mint green) | #80ed99 |
| Ring | 199 89% 48% | 150 84% 40% | same as primary |
| Gradient start | hsl(199 89% 48%) | hsl(150 84% 40%) | emerald |
| Gradient end | hsl(262 83% 58%) | hsl(140 80% 71%) | mint |
| Glow | blue-based | green-based | -- |
| Sidebar primary (dark) | 199 89% 48% | 150 84% 40% | -- |
| Sidebar ring | 217 91% 60% / 199 89% 48% | 150 84% 40% | -- |

### Files to Change

**1. `src/index.css` -- Central theme (biggest change)**

Light mode `:root`:
- `--primary`: 199 89% 48% -> 150 84% 40%
- `--accent`: 262 83% 58% -> 140 80% 71%
- `--ring`: 199 89% 48% -> 150 84% 40%
- `--gradient-primary`: both color stops change to green palette
- `--shadow-glow`: blue glow -> green glow
- `--sidebar-ring`: 217.2 91.2% 59.8% -> 150 84% 40%

Dark mode `.dark`:
- Same variable swaps as light mode
- `--primary`: 199 89% 48% -> 150 84% 40%
- `--accent`: 262 83% 58% -> 140 80% 71%
- `--ring`: same
- `--gradient-primary`: green stops
- `--shadow-glow`: green glow
- `--sidebar-primary`: 199 89% 48% -> 150 84% 40%
- `--sidebar-ring`: same

Hardcoded HSL values in animations/utilities:
- `pulse-glow` keyframes: replace `hsl(199 89% 48%)` with `hsl(150 84% 40%)`
- `hero-glow` radial gradient: replace both blue and purple HSL values with green palette equivalents

**2. `src/components/Hero.tsx` -- Social proof avatar colors**

Line 92: inline `style` uses `hsl(${199 + i * 40} ...)` to generate avatar colors. Change the base hue from 199 to 140 so the avatars cycle through greens/teals instead of blue/purple.

**3. `src/components/showcase/TweetCard.tsx` -- Verified badge color**

Line 13: `text-blue-400` on the verified badge SVG -> change to `text-primary` so it follows the theme.

**4. `src/components/ui/button.tsx` -- Gradient variant**

Line 17: `bg-gradient-to-r from-primary to-accent` -- this will automatically pick up the new primary/accent colors from CSS variables, so no code change needed here. The gradient will go from emerald to mint green.

**5. `src/components/ContentShowcase.tsx` -- Accent glow orb**

Line 56: `bg-accent/8` -- already uses the CSS variable, will auto-update. No change needed.

### What Does NOT Need to Change

Most components use Tailwind classes like `text-primary`, `bg-primary/10`, `text-accent`, `bg-accent/20` etc., which all derive from the CSS variables. Once the CSS variables are updated, these ~460 usages across 39 files automatically inherit the new green palette.

The only manual fixes are:
- 2 hardcoded HSL values in CSS animations (`pulse-glow`, `hero-glow`)
- 1 inline style in Hero.tsx (avatar hue base)
- 1 hardcoded `text-blue-400` in TweetCard.tsx

### Summary of Changes

| File | Change |
|------|--------|
| `src/index.css` | Swap all CSS custom property values from blue/purple to green palette; update hardcoded HSL in keyframes and hero-glow |
| `src/components/Hero.tsx` | Change avatar hue base from 199 to 140 |
| `src/components/showcase/TweetCard.tsx` | Change `text-blue-400` to `text-primary` |

That's it -- 3 files, full site-wide color rebrand.

