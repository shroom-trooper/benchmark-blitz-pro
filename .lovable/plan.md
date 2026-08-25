# Update typography to Plus Jakarta Sans

## Goal
Replace the current dual-font stack (Space Grotesk display + DM Sans body) with a single, cohesive typeface: **Plus Jakarta Sans** (400, 500, 600, 700). Apply the requested heading and body styling rules globally.

## Current state
- Tailwind v4 project, no `tailwind.config.js`. Design tokens live in `src/styles.css`.
- `src/routes/__root.tsx` supplies the document `<head>` via TanStack Router's `head()` option.
- Current font tokens:
  - `--font-display: "Space Grotesk", ...`
  - `--font-sans: "DM Sans", ...`
- Components use a mix of `font-display`, `font-sans`, and per-element utility classes.

## Changes

1. **Load Google Font in the document head**
   - Edit `src/routes/__root.tsx`.
   - Add `preconnect` links for `fonts.googleapis.com` and `fonts.gstatic.com` (with `crossOrigin: "anonymous"`).
   - Add a stylesheet link for:
     ```
     https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap
     ```

2. **Update CSS font tokens**
   - Edit `src/styles.css`.
   - Set both `--font-sans` and `--font-display` to `"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif`.
   - Because the same family now serves both tokens, headings and body will render consistently without needing to swap component classes.

3. **Apply global typography rules**
   - In `src/styles.css` `@layer base`:
     - Headings (`h1`–`h4` and `.font-display`):
       - `font-family: var(--font-display);`
       - `font-weight: 700;`
       - `letter-spacing: -0.02em;` (maps to `tracking-tight`)
       - `color: var(--color-slate-100)` — use the Tailwind `text-slate-100` value; since the project uses semantic tokens, add a `--color-heading: oklch(0.97 0.005 250)` (or `var(--slate-100)` equivalent) token and register `--color-heading: var(--heading)` in `@theme inline` so components can use `text-heading`.
     - Body (`body`):
       - `font-family: var(--font-sans);`
       - `font-weight: 400;`
       - `line-height: 1.625;` (maps to `leading-relaxed`)
       - `color: var(--color-slate-400)` — similarly add a `--color-body: oklch(0.72 0.035 257)` token and register `--color-body: var(--body)`.

4. **Resolve semantic-token vs. requested-color tension**
   - The user explicitly asked for `text-slate-100` headings and `text-slate-400` body.
   - Rather than hard-coding arbitrary `text-slate-100`/`text-slate-400` utility classes in dozens of places, define two new semantic tokens (`heading` and `body`) whose values match those slate shades in the current dark theme. This keeps the design system intact while honoring the exact colors requested.

5. **Component audit for conflicting font utilities**
   - Search the codebase for `font-display` and `font-sans` class usage.
   - Remove `font-display` from card titles / headings where the global rule now makes it redundant (or replace with `font-bold tracking-tight text-heading` if an explicit color override is needed).
   - Keep `font-sans` only where it is used to override a specific inherited display style.

6. **Verification**
   - Check the preview to confirm all headings render in Plus Jakarta Sans 700 and body text in 400.
   - Inspect a few key routes (`/`, `/hub`, `/admin`, `/leaderboard`) for color and weight consistency.

## Out of scope
- No changes to the 52-week curriculum, gamification logic, group/invite flows, or admin console functionality.
- No new database migrations or server functions.
