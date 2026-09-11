import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Zap, MailCheck, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RouteError, RouteNotFound } from "@/components/RouteError";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in · Benchmark hiring training" },
      {
        name: "description",
        content:
          "Sign in to Benchmark to complete this week's hiring micro-simulation, build your streak and climb the leaderboard.",
      },
      { property: "og:title", content: "Sign in · Benchmark" },
      {
        property: "og:description",
        content: "Continuous hiring capability training for managers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
});

const RESEND_COOLDOWN = 30;

function isExistingUserError(message: string): boolean {
  const m = message.toLowerCase();
  return m.includes("already registered") || m.includes("already been registered") || m.includes("user already exists");
}

/** Resolve the hub that matches the signed-in person's track. */
async function trackDestination(): Promise<"/hub" | "/recruiter"> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return "/hub";
  const { data: profile } = await supabase
    .from("profiles")
    .select("active_track, allowed_tracks")
    .eq("id", userId)
    .maybeSingle();
  const allowed = (profile?.allowed_tracks ?? []) as string[];
  if (allowed.length && !allowed.includes("interviewer") && allowed.includes("recruiter")) {
    return "/recruiter";
  }
  return profile?.active_track === "recruiter" ? "/recruiter" : "/hub";
}

function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [existingUserEmail, setExistingUserEmail] = useState<string | null>(null);
  const [signedUpEmail, setSignedUpEmail] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        void trackDestination().then((to) => router.navigate({ to }));
      }
    });
  }, [router]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  function goToSignIn(prefill?: string) {
    if (prefill) setEmail(prefill);
    setExistingUserEmail(null);
    setForgotMode(false);
    setTab("signin");
  }

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    router.navigate({ to: "/hub" });
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setExistingUserEmail(null);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/hub`,
        data: { full_name: fullName },
      },
    });
    setLoading(false);
    if (error) {
      if (isExistingUserError(error.message)) {
        setExistingUserEmail(email);
        return;
      }
      toast.error(error.message);
      return;
    }
    // Supabase returns a user with no identities when the email already exists
    // (to avoid leaking account existence) — treat it as an existing account.
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setExistingUserEmail(email);
      return;
    }
    setSignedUpEmail(email);
    setResendCooldown(RESEND_COOLDOWN);
  }

  async function resendConfirmation() {
    if (!signedUpEmail || resendCooldown > 0) return;
    setLoading(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: signedUpEmail,
      options: { emailRedirectTo: `${window.location.origin}/hub` },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Confirmation email resent.");
    setResendCooldown(RESEND_COOLDOWN);
  }

  async function sendMagicLink() {
    if (!email) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/hub` },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Sign-in link sent — check your inbox.");
  }

  async function forgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Reset link sent — check your inbox.");
    setForgotMode(false);
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Zap className="size-5" />
          </span>
          <span className="font-display text-2xl">Benchmark</span>
        </Link>

        <div className="rounded-xl border border-border bg-surface p-6">
          {signedUpEmail ? (
            <div className="space-y-5">
              <div className="flex flex-col items-center text-center">
                <span className="grid size-12 place-items-center rounded-full bg-primary/15 text-primary">
                  <MailCheck className="size-6" />
                </span>
                <h2 className="mt-4 text-xl font-bold tracking-tight">Check your inbox</h2>
                <p className="mt-2 text-sm leading-relaxed text-body">
                  We've sent a confirmation link to{" "}
                  <span className="font-medium text-foreground">{signedUpEmail}</span>. Click
                  the link in the email to activate your account and get started.
                </p>
              </div>

              <div className="rounded-lg border border-warning/40 bg-warning/10 p-4 text-sm leading-relaxed text-foreground">
                <span className="font-medium">Can't find the email?</span> Check your spam or
                junk folder, and mark it as "Not Spam" so you don't miss future updates.
              </div>

              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={resendConfirmation}
                  disabled={loading || resendCooldown > 0}
                >
                  {loading
                    ? "Sending…"
                    : resendCooldown > 0
                      ? `Resend email (${resendCooldown}s)`
                      : "Resend email"}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setSignedUpEmail(null);
                    goToSignIn(signedUpEmail);
                  }}
                >
                  Back to log in
                </Button>
              </div>
            </div>
          ) : forgotMode ? (
            <div>
              <h2 className="text-lg font-bold tracking-tight">Reset your password</h2>
              <p className="mt-1 text-sm text-body">
                Enter your work email and we'll send you a reset link.
              </p>
              <form onSubmit={forgotPassword} className="mt-4 space-y-4">
                <Field id="fp-email" label="Work email">
                  <Input
                    id="fp-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Field>
                <Button className="w-full" disabled={loading}>
                  {loading ? "Sending link…" : "Send reset link"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setForgotMode(false)}
                >
                  Back to sign in
                </Button>
              </form>
            </div>
          ) : (
            <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Create account</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={signIn} className="mt-4 space-y-4">
                  <Field id="si-email" label="Work email">
                    <Input
                      id="si-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </Field>
                  <Field id="si-pw" label="Password">
                    <Input
                      id="si-pw"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </Field>
                  <Button className="w-full" disabled={loading}>
                    {loading ? "Signing in…" : "Sign in"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={loading || !email}
                    onClick={sendMagicLink}
                  >
                    Email me a sign-in link
                  </Button>
                  <button
                    type="button"
                    onClick={() => setForgotMode(true)}
                    className="w-full text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Forgot password?
                  </button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                {existingUserEmail ? (
                  <div className="mt-4 flex items-start gap-3 rounded-lg border border-warning/40 bg-warning/10 p-4">
                    <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" />
                    <div className="text-sm leading-relaxed">
                      <p className="font-medium text-foreground">
                        An account with this email already exists.
                      </p>
                      <button
                        type="button"
                        onClick={() => goToSignIn(existingUserEmail)}
                        className="mt-1 font-medium text-primary underline-offset-4 hover:underline"
                      >
                        Log in instead
                      </button>
                    </div>
                  </div>
                ) : null}
                <form onSubmit={signUp} className="mt-4 space-y-4">
                  <Field id="su-name" label="Full name">
                    <Input
                      id="su-name"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </Field>
                  <Field id="su-email" label="Work email">
                    <Input
                      id="su-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setExistingUserEmail(null);
                      }}
                    />
                  </Field>
                  <Field id="su-pw" label="Password">
                    <Input
                      id="su-pw"
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </Field>
                  <Button className="w-full" disabled={loading}>
                    {loading ? "Creating account…" : "Create account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Train solo, or create a group and invite 1 manager and 1 recruiter — free.
        </p>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
