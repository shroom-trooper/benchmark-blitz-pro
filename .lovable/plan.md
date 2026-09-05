# Fix landing page horizontal scroll on mobile

## Problem
On phone-sized screens the landing page scrolls sideways. The cause is in the feature-story section (`src/components/FeatureStory.tsx`): each visual card has a decorative glow layer positioned with `-inset-10`, which sticks 40px out past the card on both sides. Because nothing clips it, the page becomes wider than the screen and text appears cut off until the user scrolls right.

## Changes

1. **Clip the overflow at the page level**
   - In `src/routes/index.tsx`, add `overflow-x-clip` to the landing page root wrapper so nothing can push the page wider than the screen.

2. **Tame the glow on small screens** (`src/components/FeatureStory.tsx`)
   - Change the glow layer from `-inset-10` to a smaller mobile inset (e.g. `-inset-3`) and restore `-inset-10` only at `sm:` and up, so the blur still looks rich on desktop without widening the page on phones.

3. **Mobile-friendly card spacing**
   - Reduce the visual card padding on phones (`p-5` on mobile, `p-8` from `sm:` up) so content has room.
   - Reduce the section side gaps on mobile (`gap-8` mobile, keep `lg:gap-16`).

4. **Verify**
   - Reload the landing page in the mobile preview and confirm no horizontal scrolling at ~390px width, text fully visible, and desktop layout unchanged.

## Technical notes
- Only presentation classes change; no logic, data, or routing is touched.
- `overflow-x-clip` is used instead of `overflow-x-hidden` so the sticky text column (`lg:sticky`) keeps working.
