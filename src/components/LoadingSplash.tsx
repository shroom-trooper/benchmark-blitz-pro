import { Zap } from "lucide-react";

export function LoadingSplash() {
  return (
    <div className="grid min-h-dvh place-items-center bg-background animate-fade-in">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <span
            aria-hidden
            className="absolute -inset-6 rounded-3xl bg-primary/40 blur-2xl animate-splash-glow"
          />
          <span className="relative grid size-16 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg animate-splash-pulse">
            <Zap className="size-8" />
          </span>
        </div>
        <span className="font-display text-xl tracking-tight text-foreground">
          Benchmark
        </span>
      </div>
    </div>
  );
}
