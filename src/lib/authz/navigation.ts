import type { Permission } from "./permissions";

/** Central, permission-driven navigation. Components never check role names. */
export type NavItem = {
  to: string;
  label: string;
  icon: "home" | "calendar-clock" | "gauge" | "calendar" | "users" | "layers" | "activity" | "book" | "shield" | "settings";
};

export type Experience = "participant" | "team" | "reviewer";

export function experienceFor(permissions: readonly string[]): Experience {
  const set = new Set(permissions);
  if (set.has("capability.read_team")) return "team";
  if (set.has("content.review")) return "reviewer";
  return "participant";
}

const PARTICIPANT: NavItem[] = [
  { to: "/home", label: "Home", icon: "home" },
  { to: "/interviews", label: "Interviews", icon: "calendar-clock" },
  { to: "/progress", label: "Progress", icon: "gauge" },
  { to: "/settings/calendar", label: "Settings", icon: "settings" },
];

const REVIEWER: NavItem[] = [
  { to: "/governance/review", label: "Review queue", icon: "book" },
  { to: "/governance/content", label: "Content library", icon: "layers" },
  { to: "/governance/flags", label: "Flagged questions", icon: "shield" },
];

export function visibleNav(permissions: readonly string[]): NavItem[] {
  const set = new Set<string>(permissions);
  const exp = experienceFor(permissions);
  if (exp === "participant") return PARTICIPANT;
  if (exp === "reviewer") return REVIEWER;
  const items: NavItem[] = [
    { to: "/readiness", label: "Readiness", icon: "activity" },
  ];
  if (set.has("members.read")) items.push({ to: "/readiness/people", label: "People", icon: "users" });
  if (set.has("content.read")) items.push({ to: "/governance/content", label: "Content", icon: "book" });
  if (set.has("members.manage") || set.has("roles.assign")) items.push({ to: "/governance", label: "Admin", icon: "shield" });
  return items;
}

/** Secondary link so staff can still reach their own training. */
export function personalLink(permissions: readonly string[]): NavItem | null {
  return experienceFor(permissions) === "participant" ? null : { to: "/home", label: "My training", icon: "home" };
}

export type Landing = "/home" | "/readiness" | "/governance/review";

/** Where a user should land after sign-in, invitation or onboarding. */
export function landingFor(permissions: readonly string[]): Landing {
  const exp = experienceFor(permissions);
  if (exp === "team") return "/readiness";
  if (exp === "reviewer") return "/governance/review";
  return "/home";
}
