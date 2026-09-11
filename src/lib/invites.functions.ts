import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const tokenSchema = z.object({ token: z.string().min(8).max(200) });

function maskEmail(email: string) {
  const [user = "", domain = ""] = email.split("@");
  const head = user.slice(0, 2);
  return `${head}${"•".repeat(Math.max(1, user.length - 2))}@${domain}`;
}

function appUrl() {
  return process.env["APP_URL"] || "https://usebenchmark.app";
}

/** Look up an invite by its private token. Public: returns nothing sensitive. */
export const getInviteByToken = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => tokenSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: invite } = await supabaseAdmin
      .from("invites")
      .select("id, status, track, group_id")
      .eq("token", data.token)
      .maybeSingle();
    if (!invite) return { state: "invalid" as const };
    if (invite.status !== "pending") {
      return { state: invite.status === "accepted" ? ("accepted" as const) : ("revoked" as const) };
    }
    const { data: group } = await supabaseAdmin
      .from("groups")
      .select("name")
      .eq("id", invite.group_id)
      .maybeSingle();
    return {
      state: "pending" as const,
      groupName: group?.name ?? "a Benchmark group",
      track: invite.track === "recruiter" ? ("recruiter" as const) : ("interviewer" as const),
    };
  });

/** Email the invited address a one-click sign-in link back to this invite page. */
export const startInviteSignIn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => tokenSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: invite } = await supabaseAdmin
      .from("invites")
      .select("id, email, status")
      .eq("token", data.token)
      .maybeSingle();
    if (!invite || invite.status !== "pending") {
      return { ok: false as const, error: "This invitation is no longer available." };
    }

    const { createClient } = await import("@supabase/supabase-js");
    const url = process.env["SUPABASE_URL"]!;
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
            h.delete("Authorization");
          }
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });

    const { error } = await client.auth.signInWithOtp({
      email: invite.email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${appUrl()}/accept-invite?token=${encodeURIComponent(data.token)}`,
      },
    });
    if (error) {
      console.error("[invite] magic link failed", error.message);
      return { ok: false as const, error: "We couldn't send your sign-in link. Please try again." };
    }
    return { ok: true as const, email: maskEmail(invite.email) };
  });

/** Finish acceptance for the signed-in invitee: join group, single track only. */
export const completeInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => tokenSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;
    const sessionEmail = String(
      (context.claims as Record<string, unknown> | undefined)?.["email"] ?? "",
    ).toLowerCase();

    const { data: invite } = await supabaseAdmin
      .from("invites")
      .select("id, email, status, track, group_id")
      .eq("token", data.token)
      .maybeSingle();
    if (!invite) return { ok: false as const, error: "This invitation link isn't valid." };

    const track = invite.track === "recruiter" ? ("recruiter" as const) : ("interviewer" as const);

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email, group_id, allowed_tracks")
      .eq("id", userId)
      .maybeSingle();
    const email = (sessionEmail || profile?.email || "").toLowerCase();

    if (email !== invite.email.toLowerCase()) {
      return {
        ok: false as const,
        error: "This invitation was sent to a different email address.",
      };
    }

    // Already joined this group — just make sure track access is right.
    if (invite.status === "accepted" && profile?.group_id === invite.group_id) {
      await supabaseAdmin
        .from("profiles")
        .update({ allowed_tracks: [track], active_track: track })
        .eq("id", userId);
      return { ok: true as const, track };
    }

    if (invite.status !== "pending") {
      return {
        ok: false as const,
        error:
          "This invitation is no longer active. Please ask your group owner to invite you again.",
      };
    }

    const { error } = await supabaseAdmin.rpc("accept_invite", {
      _invite_id: invite.id,
      _actor: userId,
    });
    if (error) {
      return { ok: false as const, error: error.message };
    }

    await supabaseAdmin
      .from("profiles")
      .update({ allowed_tracks: [track], active_track: track })
      .eq("id", userId);

    return { ok: true as const, track };
  });
