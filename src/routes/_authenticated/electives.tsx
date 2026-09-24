import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/electives")({
  // Phase 5: retired surface, kept for data history.
  beforeLoad: () => {
    throw redirect({ to: "/home", replace: true });
  },
  component: () => <Outlet />,
});
