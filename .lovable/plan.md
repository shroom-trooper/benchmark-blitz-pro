# Open signup, personal groups, and a public leaderboard

Shift Benchmark from "one org, first user is admin" to a self-serve product anyone can join from a LinkedIn link — take the weekly tests solo, or create a group and track up to 3 managers.

## What changes

### Signup and roles
- Remove the rule that the first account becomes the admin.
- After signup, a one-screen choice:
  - **Just train me** — solo player, appears on the public leaderboard.
  - **Create a group** — becomes a group admin, names the group, gets the admin console.
- Solo users can create a group later from the hub at any time; group admins also train and appear on both boards.
- New users pick a **display name** at signup (defaults from their name, editable in the hub). This is what shows on the public leaderboard.

### Groups (replaces "departments")
- A group belongs to one admin: name, owner, created date.
- **Free tier cap: 3 members plus the admin.** The admin's own scores count on the group board.
- Joining is by **email invite only**: the admin enters an email; that person sees the invite when they sign in with the matching address and accepts to join. Pending/accepted status and revoke are shown in the console.
- Attempting a 4th invite/join shows an upgrade prompt: "Group limit reached — larger teams coming soon" with a "Notify me" capture so demand is measurable.
- A person belongs to at most one group.

### Leaderboards
- **Public leaderboard** — everyone who trains, ranked by XP, showing display name, level, streak. Readable without signing in so it can be shared from LinkedIn (safe columns only: display name, level, XP, streak — no email).
- **Group leaderboard** — visible to members of that group, plus group completion stats.
- The leaderboard page shows both tabs; group tab appears only for group members.

### Admin console (rescoped)
- Manages **their group only**, not the whole platform: members, invites, group leaderboard, and per-member progress (weeks completed, accuracy, weak areas).
- Curriculum editing and global release schedule stop being per-admin — the 52-week schedule is platform-wide and read-only for group admins.

## Technical notes

- Database: add `groups` (name, owner) and migrate `departments`/`profiles.department_id` to `group_id`; add `profiles.display_name`; `invites` gains `group_id` and accept flow. Cap enforced by a validation trigger on membership (3 members + owner) so it can't be bypassed client-side.
- Row-level security: a group's data is readable by its members and owner; public leaderboard exposed through a narrow anon-readable view of safe profile columns.
- `handle_new_user` no longer grants `ta_admin`; role is granted server-side when a user creates a group.
- Public leaderboard route moves out of the authenticated layout and reads through a public server function (no bearer token), so it renders for logged-out visitors and shares with proper preview tags.
- Existing users: current admin keeps admin, existing departments become groups owned by them.

## Deferred
- Paywall/billing for larger groups — this build only caps at 3 and captures interest.
- Multiple groups per user, sub-teams, and org-wide telemetry across groups.
