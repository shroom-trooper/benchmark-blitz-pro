import { createFileRoute, redirect } from "@tanstack/react-router";

// Retired: capability now lives inside Progress.
export const Route = createFileRoute("/_authenticated/capability")({
  beforeLoad: () => {
    throw redirect({ to: "/progress", replace: true });
  },
});
