import { Link, useRouter } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

function isOffline() {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

export function RouteError({ error }: { error?: Error }) {
  const router = useRouter();
  const offline = isOffline();
  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-lg flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl border border-border bg-card">
        <AlertTriangle className="size-5 text-amber-400" />
      </div>
      <h1 className="text-lg font-semibold text-foreground">
        {offline ? "You appear to be offline" : "We couldn't load this page"}
      </h1>
      <p className="text-sm text-muted-foreground">
        {offline
          ? "Check your connection and try again — nothing you've completed is lost."
          : (error?.message?.slice(0, 200) ??
            "Something went wrong while loading your data.")}
      </p>
      <div className="flex gap-2">
        <Button onClick={() => void router.invalidate()}>Try again</Button>
        <Button variant="outline" asChild>
          <Link to="/">Go home</Link>
        </Button>
      </div>
    </div>
  );
}

export function RouteNotFound() {
  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-lg flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="text-lg font-semibold text-foreground">Page not found</h1>
      <p className="text-sm text-muted-foreground">
        That page doesn't exist or is no longer available.
      </p>
      <Button variant="outline" asChild>
        <Link to="/">Go home</Link>
      </Button>
    </div>
  );
}
