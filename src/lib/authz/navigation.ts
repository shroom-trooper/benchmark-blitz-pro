import type { Permission } from "./permissions";

/** Central, permission-driven navigation. Components never check role names. */
export type NavItem = {
  to: string;
  label: string;
  icon: "home" | "calendar-clock" | "gauge" | "calendar" | "users" | "layers" | "activity" | "book" | "shield" | "settings";
  /** Shown when the user holds ANY of these permissions. Empty = every signed-in user. */
  anyOf: Permission[];
  group: "primary" | "team" | "content" | "admin";
};

export const NAV_ITEMS: NavItem[] = [
  { to: "/home", label: "Home", icon: "home", anyOf: [], group: "primary" },
  { to: "/interviews", label: "Interviews", icon: "calendar-clock", anyOf: [], group: "primary" },
  { to: "/capability", label: "My capability", icon: "gauge", anyOf: [], group: "primary" },
  { to: "/readiness", label: "Readiness", icon: "activity", anyOf: ["capability.read_team"], group: "team" },
  { to: "/readiness/people", label: "People", icon: "users", anyOf: ["members.read"], group: "team" },
  { to: "/readiness/capability", label: "Team capability", icon: "layers", anyOf: ["capability.read_team"], group: "team" },
  { to: "/readiness/program", label: "Program health", icon: "activity", anyOf: ["capability.read_team"], group: "team" },
  { to: "/governance/content", label: "Content", icon: "book", anyOf: ["content.read"], group: "content" },
  { to: "/governance/review", label: "Review queue", icon: "book", anyOf: ["content.review"], group: "content" },
  { to: "/governance/flags", label: "Flagged questions", icon: "book", anyOf: ["question_flags.read"], group: "content" },
  { to: "/admin", label: "Access", icon: "shield", anyOf: ["members.manage"], group: "admin" },
  { to: "/governance", label: "Governance", icon: "shield", anyOf: ["roles.assign", "principles.manage", "retention.manage", "audit.read"], group: "admin" },
  { to: "/settings/calendar", label: "Calendar & settings", icon: "settings", anyOf: [], group: "primary" },
];

export function visibleNav(permissions: readonly string[]): NavItem[] {
  const set = new Set(permissions);
  return NAV_ITEMS.filter((i) => i.anyOf.length === 0 || i.anyOf.some((p) => set.has(p)));
}

/** Where a user should land after sign-in. TA staff without their own interviews start on Readiness. */
export function landingFor(permissions: readonly string[]): "/home" | "/readiness" {
  const set = new Set(permissions);
  return set.has("capability.read_team") && !set.has("preparation.complete_own") ? "/readiness" : "/home";
}
