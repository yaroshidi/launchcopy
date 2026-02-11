

# Reposition "Private repo" Button and Use a Dialog for Token Input

## What Changes

1. **"Private repo" button alignment** -- Move it so it sits directly beneath the Analyze button on the right side of the input bar, instead of floating in its own container. Remove the `float-right` wrapper and position the button using `flex justify-end` so it right-aligns under the Analyze button cleanly.

2. **Replace inline token field with a centered Dialog** -- Instead of expanding the token input inline below the button (which pushes content down), clicking "Private repo" will open a small centered Dialog (using the existing `Dialog` component from `@/components/ui/dialog`). The dialog will contain:
   - A title ("Private Repository Access")
   - The token input field with the Key icon
   - A Clear button (when a token is present)
   - A short help text about token storage
   - A "Save" button to confirm and close
   - A link to GitHub token creation page

3. **State change** -- Replace the `showToken` boolean toggle with a `tokenDialogOpen` boolean that controls the Dialog's `open` prop. The token value itself (`githubToken`) stays as-is, stored in localStorage on save.

## File to Modify

**`src/components/RepoInput.tsx`**

### Layout changes (lines 105-158):
- Remove the `float-right` div wrapper and its inline token input
- Add a simple `flex justify-end` div containing only the "Private repo" chip button
- The button toggles `tokenDialogOpen` instead of `showToken`
- If a token is already saved, show a small green dot or checkmark on the chip to indicate it's configured

### New Dialog section:
- Import `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription` from `@/components/ui/dialog`
- Render a `Dialog` controlled by `tokenDialogOpen`
- Inside: the Key icon input, Clear button, help text, and a "Save & Close" button
- On save: persist to localStorage and close the dialog

### Visual result:
```text
[GitHub icon] [repo URL input_______________] [Analyze ->]
                                               Private repo   <-- right-aligned chip
[Tone] [Audience] [Industry] [Voice]                          <-- preference chips
```

Clicking "Private repo" opens a centered modal dialog with the token input field.
