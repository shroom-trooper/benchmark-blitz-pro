import { describe, it, expect } from "vitest";
import { visibleNav, landingFor, personalLink } from "@/lib/authz/navigation";
import { permissionsFor } from "@/lib/authz/permissions";

type Roles = Parameters<typeof permissionsFor>[0];
const perms = (roles: Roles) => [...permissionsFor(roles)];
const labels = (roles: Roles) => visibleNav(perms(roles)).map((i) => i.label);

describe("permission-aware navigation", () => {
  it("participants (and users without an organization) see only personal items", () => {
    expect(labels(["participant"])).toEqual(["Home", "Interviews", "Progress", "Settings"]);
    expect(visibleNav([]).map((i) => i.label)).toEqual(["Home", "Interviews", "Progress", "Settings"]);
  });
  it("TA admins see Readiness, People, Content, Admin", () => {
    expect(labels(["ta_admin"])).toEqual(["Readiness", "People", "Content", "Admin"]);
  });
  it("reviewers see only content review", () => {
    expect(labels(["content_reviewer"])).toEqual(["Review queue", "Content library", "Flagged questions"]);
  });
  it("org admins see the four staff sections", () => {
    expect(labels(["organization_admin"])).toEqual(["Readiness", "People", "Content", "Admin"]);
  });
  it("never shows duplicates or retired surfaces", () => {
    for (const r of [["participant"], ["ta_admin"], ["content_reviewer"], ["organization_admin", "participant"]] as Roles[]) {
      const l = labels(r);
      expect(new Set(l).size).toBe(l.length);
      for (const w of ["Leaderboard", "Hub", "Electives", "Recruiter"]) expect(l.join(" ")).not.toContain(w);
    }
  });
});

describe("role-aware landing", () => {
  it("routes each role", () => {
    expect(landingFor(perms(["participant"]))).toBe("/home");
    expect(landingFor([])).toBe("/home");
    expect(landingFor(perms(["ta_admin"]))).toBe("/readiness");
    expect(landingFor(perms(["content_reviewer"]))).toBe("/governance/review");
    expect(landingFor(perms(["organization_admin"]))).toBe("/readiness");
  });
  it("multi-role users land on their operational screen but keep personal training", () => {
    expect(landingFor(perms(["participant", "ta_admin"]))).toBe("/readiness");
    expect(landingFor(perms(["participant", "content_reviewer"]))).toBe("/governance/review");
    expect(personalLink(perms(["participant", "ta_admin"]))?.to).toBe("/home");
    expect(personalLink(perms(["participant"]))).toBeNull();
  });
});
