# Remove the flash of the wrong hub before redirecting

## Why it happens

The redirect runs after the page has already rendered. The order today is:

```text
sign in -> open /hub -> load profile -> draw interviewer hub -> notice "recruiter only" -> redirect
```

Every step after "draw" happens in the same instant, but the drawing already
happened, so a recruiter-only member sees the interviewer hub for a moment.
The same is true in reverse on the recruiter page.

## The fix

Don't draw the page until we know the person belongs on it.

- On the interviewer hub: while the profile is still loading, or the person is
  recruiter-only and about to be sent away, show the existing loading
  placeholder instead of the hub content.
- On the recruiter hub: same, mirrored.

That turns the flash into a brief loading state that then lands on the right
page.

## Technical detail

- `src/routes/_authenticated/hub.tsx`: keep the existing `useEffect` redirect,
  but compute `const redirecting = !!allowedTracks && !allowedTracks.includes("interviewer") && allowedTracks.includes("recruiter")`
  and include it in the early-return guard alongside `isLoading || !me`, so the
  `Skeleton` renders instead of the hub body.
- `src/routes/_authenticated/recruiter.index.tsx`: mirror it with the
  interviewer-only condition, added to the existing
  `query.isLoading || !query.data` guard.

No data, routing, or backend changes.
