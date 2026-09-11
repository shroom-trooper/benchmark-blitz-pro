# Fix track-aware invite acceptance

## Goal
Allow a user who owns a group on one training track to accept an invitation for the other track without a blank-screen error.

## Changes
- Replace the blanket “owns any group” rejection in the secure invite function with a same-track ownership check.
- Keep rejecting invitations when the user already owns a group on the invited track.
- Preserve invitation email matching, pending-status checks, seat limits, and invited-track access rules.
- Apply the database migration and verify the invite function plus the app build.

## Technical detail
The current function predates dual-track groups and checks only `owner_id`. The corrected rule will compare the invited group’s `track` with groups owned by the accepting user.
