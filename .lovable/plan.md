# Full-screen loading splash while the hub resolves

## What you see today

While the app checks who you are and which track you belong on, both hubs
show a plain gray skeleton block. It works, but it feels like a broken page
rather than a branded "we're getting things ready" moment.

## What we'll build

A full-screen splash screen shown any time the hub is resolving
authentication, loading your profile, or about to redirect you to the other
track:

```text
┌─────────────────────────────────────┐
│                                     │
│              ( dark )               │
│                                     │
│        ┌──────────────┐             │
│        │      ⚡      │  ← soft     │
│        │  Benchmark   │    glow     │
│        │     logo     │    pulse    │
│        └──────────────┘             │
│                                     │
└─────────────────────────────────────┘
        fades out → hub fades in
```

- Centered Benchmark mark (the lightning-bolt tile, same as the header) with
  a smooth glowing/pulsing halo animation behind it.
- Matches the site's dark, high-contrast theme — no white flash.
- When the destination is ready, the splash fades out and the page content
  fades in, so the handoff feels graceful instead of a hard cut.
- Used on both the interviewer hub and the recruiter hub, replacing the
  skeleton placeholder. This also covers the redirect case, so the splash is
  what shows during the brief moment before a member lands on the right page.

## Technical detail

- New component `src/components/LoadingSplash.tsx`: full-screen grid, logo
  tile with a pulsing `box-shadow`/blur halo (CSS keyframes added to
  `src/styles.css`), optional short label, and a fade-out on unmount via a
  small opacity transition.
- `src/routes/_authenticated/hub.tsx` and
  `src/routes/_authenticated/recruiter.index.tsx`: swap the
  `Skeleton` early-return for `<LoadingSplash />` in the existing
  `isLoading || !data || redirecting` guards.
- Purely visual: no routing, data, or backend changes.
