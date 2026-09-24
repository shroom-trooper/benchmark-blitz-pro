import { describe, it, expect } from "vitest";
import { visibleNav, landingFor } from "@/lib/authz/navigation";
import { permissionsFor } from "@/lib/authz/permissions";

const labels = (roles: Parameters<typeof permissionsFor>[0]) => visibleNav([...permissionsFor(roles)]).map((i) => i.label);

describe("permission-aware navigation", () => {
  it("participants see only personal items", () => {
    expect(labels(["participant"])).toEqual(["Home", "Interviews", "My capability", "Calendar & settings"]);
  });
  it("never shows retired surfaces", () => {
    const all = labels(["organization_admin", "participant"]).join(" ");
    for (const w of ["Leaderboard", "Hub", "Electives", "Recruiter", "Practice"]) expect(all).not.toContain(w);
  });
  it("TA admins get readiness; reviewers get content", () => {
    expect(labels(["ta_admin"])).toContain("Readiness");
    expect(labels(["content_reviewer"])).toContain("Review queue");
    expect(labels(["content_reviewer"])).not.toContain("Readiness");
  });
  it("only org admins see governance admin", () => {
    expect(labels(["organization_admin"])).toContain("Governance");
    expect(labels(["ta_admin"])).not.toContain("Governance");
  });
  it("lands TA-only staff on readiness, participants on home", () => {
    expect(landingFor([...permissionsFor(["ta_admin"])])).toBe("/readiness");
    expect(landingFor([...permissionsFor(["participant", "ta_admin"])])).toBe("/home");
  });
});
