import { createFileRoute } from "@tanstack/react-router";
import { RouteError, RouteNotFound } from "@/components/RouteError";
import { QuestionList } from "./governance.content";

export const Route = createFileRoute("/_authenticated/governance/review")({
  component: () => <QuestionList fixedStatus="in_review" />,
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
});
