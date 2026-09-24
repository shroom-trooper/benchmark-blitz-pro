import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { RouteError, RouteNotFound } from "@/components/RouteError";

export const Route = createFileRoute("/_authenticated/recruiter")({
  // Phase 5: retired surface, kept for data history.
  beforeLoad: () => {
    throw redirect({ to: "/home", replace: true });
  },
  component: () => <Outlet />,
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
});
