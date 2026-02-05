
# Immersive Loading Experience for Repository Analysis

## Overview
The repository analysis takes 20-30 seconds, leaving users staring at a simple "Analyzing..." button. This plan creates an engaging, animated full-screen overlay that keeps users informed and entertained throughout the process.

## What You'll Get

**Visual Experience:**
- Full-screen animated overlay with gradient orbs and floating particles
- Sequential progress steps showing what the AI is doing in real-time
- Rotating informative messages that cycle every few seconds
- Progress bar with estimated time remaining
- Smooth fade transitions when appearing/disappearing

**Progress Steps (animated sequentially):**
1. Fetching repository from GitHub
2. Reading codebase structure
3. Understanding the product
4. Generating marketing content

**Rotating Messages:**
- "Crawling through your codebase..."
- "Understanding your product's value..."
- "Crafting compelling narratives..."
- "Generating social-ready content..."

## Visual Preview

```text
+--------------------------------------------------+
|                                                  |
|    [Animated gradient orbs in background]        |
|    [Floating sparkle particles rising up]        |
|                                                  |
|  +--------------------------------------------+  |
|  |   Analyzing github.com/owner/repo         |  |
|  +--------------------------------------------+  |
|                                                  |
|     [Check] Fetching repository...         Done  |
|     [Spin]  Reading codebase...         Current  |
|     [ ]     Understanding product...     Pending |
|     [ ]     Generating content...        Pending |
|                                                  |
|   "Crafting compelling narratives..."            |
|                                                  |
|   [=========>                        ] ~15s      |
|                                                  |
+--------------------------------------------------+
```

## Implementation Details

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/AnalyzingOverlay.tsx` | New full-screen loading overlay component |

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Index.tsx` | Add overlay rendering when `isLoading` is true, pass repo URL to overlay |
| `src/index.css` | Add new keyframe animations for particles and enhanced effects |

### Component Structure

**AnalyzingOverlay.tsx** will include:
- **Background Effects:** Animated pulsing gradient orbs (reusing existing `animate-pulse-soft`)
- **Floating Particles:** Small sparkles that float upward using new CSS keyframes
- **Progress Steps:** Array of steps with icons (Github, Code, Brain, FileText) that animate through states
- **Message Rotator:** `useEffect` with interval to cycle through encouraging messages
- **Progress Bar:** Animated bar that fills over ~25 seconds
- **Time Estimate:** Countdown showing approximate time remaining

**Animation Logic:**
- Step 1 completes at ~3 seconds
- Step 2 completes at ~8 seconds
- Step 3 completes at ~15 seconds
- Step 4 stays "in progress" until actual completion
- Messages rotate every 3 seconds

### New CSS Animations

```css
@keyframes float-up {
  0% { transform: translateY(0) scale(1); opacity: 0.8; }
  100% { transform: translateY(-100vh) scale(0.5); opacity: 0; }
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 20px hsl(199 89% 48% / 0.3); }
  50% { box-shadow: 0 0 40px hsl(199 89% 48% / 0.5); }
}
```

### Integration in Index.tsx

The overlay will be conditionally rendered alongside the Hero when `isLoading` is true:

```tsx
{isLoading && (
  <AnalyzingOverlay repoUrl={currentUrl} />
)}
```

The URL will be captured when the user clicks Analyze and stored in local state.

## User Experience Flow

1. User pastes GitHub URL and clicks **Analyze**
2. Button changes to "Analyzing..." with spinner
3. **AnalyzingOverlay** fades in over the Hero
4. Progress steps animate through sequentially
5. Messages rotate to keep user engaged
6. Progress bar fills gradually
7. When complete, overlay fades out and Dashboard slides in

## Technical Notes

- Uses existing Framer Motion library for smooth enter/exit animations
- Leverages existing design system (glass-card, gradient-text, color variables)
- Particles generated as an array of positioned divs with staggered animation delays
- All timing is approximate to keep users engaged without overpromising
