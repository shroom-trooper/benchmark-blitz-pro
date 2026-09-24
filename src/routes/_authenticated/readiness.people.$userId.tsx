import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { getMemberProfile } from "@/lib/readiness-dashboard.functions";
import { ProfileView } from "@/components/readiness/ProfileView";
import { Empty } from "@/components/readiness/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { track } from "@/lib/analytics";
import { RouteError, RouteNotFound } from "@/components/RouteError";

export const Route = createFileRoute("/_authenticated/readiness/people/$userId")({
  component: Person,
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
});

function Person() {
  const { userId } = Route.useParams();
  const fn = useServerFn(getMemberProfile);
  const q = useQuery({ queryKey: ["member-profile", userId], queryFn: () => fn({ data: { memberId: userId } }), retry: false });
  useEffect(() => {
    track("individual_profile_opened");
  }, [userId]);
  useEffect(() => {
    if (q.data) track("coaching_recommendation_viewed", { reason: q.data.recommendation.reason });
  }, [q.data]);
  return (
    <div className="space-y-6">
      <Link to="/readiness/people" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> People
      </Link>
      {q.isLoading ? <Skeleton className="h-72 w-full rounded-xl" /> : null}
      {q.isError ? <Empty>You can only view profiles of members in your group.</Empty> : null}
      {q.data ? (
        <>
          <h2 className="text-2xl">{q.data.name}</h2>
          <ProfileView d={q.data} />
        </>
      ) : null}
    </div>
  );
}
