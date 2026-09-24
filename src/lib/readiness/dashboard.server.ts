/**
 * TA readiness dashboard — server-side data loading.
 * Loads bounded, safe columns in one query per data type (chunked by id), then hands
 * everything to the pure metric module. Never selects CV text, Gmail content, calendar
 * descriptions, candidate names/emails or credentials.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { AREA_LABELS, CAPABILITY_AREAS, type CapabilityArea } from "./taxonomy";
import { professionalLevel, strongestAndPriority, type EvidenceItem } from "./scoring";
import {
  MAX_RANGE_DAYS,
  MIN_AGGREGATE_GROUP,
  TEAM_METHOD,
  aggregateTeam,
  buildAttention,
  completedBeforeStart,
  computeFunnel,
  computeReadinessMetrics,
  hasCurrentEvidence,
  hasFourAreaCoverage,
  interviewStatus,
  isEligible,
  lastEvidence,
  latestSessions,
  personProgress,
  ratio,
  recommendNext,
  toCsv,
  type DeliveryRow,
  type InterviewRow,
  type SessionRow,
} from "./metrics";

type DB = SupabaseClient<Database>;
const DAY = 86_400_000;
/** Evidence older than this is ignored (its recency weight is already < 7%). */
const EVIDENCE_LOOKBACK_DAYS = 365;

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

function chunks<T>(xs: T[], n = 150): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < xs.length; i += n) out.push(xs.slice(i, i + n));
  return out;
}

async function inChunks<R>(ids: string[], q: (part: string[]) => PromiseLike<{ data: R[] | null; error: unknown }>) {
  const out: R[] = [];
  for (const part of chunks(ids)) {
    const { data, error } = await q(part);
    if (error) throw new Error("Could not load readiness data");
    out.push(...(data ?? []));
  }
  return out;
}

export type Range = { from: string; to: string };
export type RangeInput = { from?: string | undefined; to?: string | undefined };

export function normalizeRange(r: RangeInput | undefined, now = Date.now()): { from: number; to: number } {
  let from = r?.from ? new Date(r.from).getTime() : now - 30 * DAY;
  let to = r?.to ? new Date(r.to).getTime() : now + 30 * DAY;
  if (!Number.isFinite(from)) from = now - 30 * DAY;
  if (!Number.isFinite(to)) to = now + 30 * DAY;
  if (to < from) [from, to] = [to, from];
  if (to - from > MAX_RANGE_DAYS * DAY) from = to - MAX_RANGE_DAYS * DAY;
  return { from, to };
}

/** Authorization: the caller must own an interviewer group. Returns its active members (owner excluded). */
export async function requireOwnedInterviewerGroup(sb: DB, userId: string) {
  const { data: group } = await sb
    .from("groups")
    .select("id, name")
    .eq("owner_id", userId)
    .eq("track", "interviewer")
    .maybeSingle();
  if (!group) return null;
  const a = await admin();
  const { data: members } = await a
    .from("profiles")
    .select("id, display_name, full_name")
    .eq("group_id", group.id)
    .neq("id", userId);
  return {
    group,
    members: (members ?? []).map((m) => ({ id: m.id, name: m.display_name || m.full_name || "Member" })),
  };
}

async function loadGroupData(memberIds: string[], from: number, to: number) {
  const a = await admin();
  const now = Date.now();
  const evFrom = new Date(Math.min(from, now) - DAY).toISOString();
  const evTo = new Date(Math.max(to, now + 30 * DAY)).toISOString();

  const interviewsRaw = await inChunks(memberIds, (ids) =>
    a
      .from("interview_events")
      .select("id, interviewer_id, role_title, interview_stage, starts_at, created_at, status, confirmation_status, source")
      .in("interviewer_id", ids)
      .gte("starts_at", evFrom)
      .lte("starts_at", evTo)
      .order("starts_at")
      .limit(5000),
  );
  const ivIds = interviewsRaw.map((i) => i.id);
  const [contexts, sessions, deliveries, evidence, connections, achievements, detected] = await Promise.all([
    inChunks(ivIds, (ids) => a.from("interview_contexts").select("interview_event_id, context_completeness_score, context_sources").in("interview_event_id", ids)),
    inChunks(ivIds, (ids) =>
      a.from("prep_sessions").select("id, interview_event_id, interviewer_id, status, generated_at, started_at, completed_at").in("interview_event_id", ids),
    ),
    inChunks(ivIds, (ids) => a.from("notification_deliveries").select("interview_event_id, notification_type, status").in("interview_event_id", ids)),
    inChunks(memberIds, (ids) =>
      a
        .from("capability_evidence")
        .select("user_id, capability_area, sub_skill, is_correct, difficulty, recorded_at, prep_session_id, prep_question_id")
        .in("user_id", ids)
        .gte("recorded_at", new Date(now - EVIDENCE_LOOKBACK_DAYS * DAY).toISOString())
        .limit(50000),
    ),
    inChunks(memberIds, (ids) => a.from("calendar_connections").select("user_id, status").in("user_id", ids)),
    inChunks(memberIds, (ids) => a.from("user_achievements").select("user_id, achievement_code, earned_at").in("user_id", ids)),
    inChunks(memberIds, (ids) =>
      a
        .from("normalized_calendar_events")
        .select("id, classification_status, linked_interview_event_id")
        .in("user_id", ids)
        .gte("starts_at", new Date(from).toISOString())
        .lte("starts_at", new Date(to).toISOString()),
    ),
  ]);
  const detectedIds = detected.filter((d) => d.classification_status !== "not_interview").map((d) => d.id);
  const attachments = await inChunks(detectedIds, (ids) =>
    a.from("calendar_event_attachments").select("processing_status").in("normalized_calendar_event_id", ids),
  );

  const ctxBy = new Map(contexts.map((c) => [c.interview_event_id, c]));
  const interviews: InterviewRow[] = interviewsRaw.map((i) => ({
    ...i,
    context_score: ctxBy.get(i.id)?.context_completeness_score ?? null,
  }));
  return {
    interviews,
    contextSources: new Map(contexts.map((c) => [c.interview_event_id, (c.context_sources as string[] | null) ?? []])),
    sessions: sessions as SessionRow[],
    deliveries: deliveries as DeliveryRow[],
    evidence,
    connections,
    achievements,
    detected,
    attachments,
  };
}

function evidenceByUser(rows: (EvidenceItem & { user_id: string })[]) {
  const m = new Map<string, EvidenceItem[]>();
  for (const r of rows) {
    const arr = m.get(r.user_id) ?? [];
    arr.push(r);
    m.set(r.user_id, arr);
  }
  return m;
}

const ACHIEVEMENT_NAMES: Record<string, string> = {
  prep_first: "First interview prepared",
  prep_5: "5 interviews prepared",
  prep_10: "10 interviews prepared",
  prep_advance_3: "Prepared ahead three times",
  prep_perfect: "Perfect preparation",
  area_proficient: "Calibrated in a capability",
  all_areas_developing: "Four-area foundation",
};

/** Full group dashboard. One call powers all five tabs (cached client-side per range). */
export async function getReadinessDashboard(sb: DB, userId: string, range?: RangeInput) {
  const auth = await requireOwnedInterviewerGroup(sb, userId);
  if (!auth) return null;
  const now = Date.now();
  const { from, to } = normalizeRange(range, now);
  const memberIds = auth.members.map((m) => m.id);
  const nameOf = new Map(auth.members.map((m) => [m.id, m.name]));
  const base = { group: auth.group, range: { from: new Date(from).toISOString(), to: new Date(to).toISOString() }, teamMethod: TEAM_METHOD, minGroup: MIN_AGGREGATE_GROUP };
  if (!memberIds.length) return { ...base, empty: true as const };

  const d = await loadGroupData(memberIds, from, to);
  const members = new Set(memberIds);
  const latest = latestSessions(d.sessions);
  const delivBy = new Map<string, DeliveryRow[]>();
  for (const x of d.deliveries) delivBy.set(x.interview_event_id, [...(delivBy.get(x.interview_event_id) ?? []), x]);
  const evBy = evidenceByUser(d.evidence as (EvidenceItem & { user_id: string })[]);

  // Interviews table (safe fields only — no candidate name).
  const interviewRows = d.interviews
    .filter((i) => new Date(i.starts_at).getTime() >= from && new Date(i.starts_at).getTime() <= to)
    .map((i) => {
      const s = latest.get(i.id);
      const status = interviewStatus(i, s, delivBy.get(i.id) ?? [], now);
      const deliveries = delivBy.get(i.id) ?? [];
      return {
        id: i.id,
        startsAt: i.starts_at,
        interviewerId: i.interviewer_id,
        interviewer: nameOf.get(i.interviewer_id) ?? "Member",
        role: i.role_title,
        stage: i.interview_stage,
        source: i.source === "calendar" ? "Google Calendar" : i.source === "ats" ? "ATS" : "Manual",
        contextStatus: (i.context_score ?? 0) >= 30 ? "Sufficient" : i.context_score === null ? "Missing" : "Limited",
        status,
        eligible: isEligible(i, members, from, to),
        deliveryStatus: deliveries.find((x) => x.notification_type === "preparation")?.status ?? (s ? "in_app" : "none"),
        completedAt: s?.completed_at ?? null,
        onTime: completedBeforeStart(i, s),
        durationMinutes:
          s?.started_at && s.completed_at ? Math.max(0, Math.round((new Date(s.completed_at).getTime() - new Date(s.started_at).getTime()) / 60_000)) : null,
        areasPracticed: [
          ...new Set(
            (evBy.get(i.interviewer_id) ?? []).filter((e) => s && e.prep_session_id === s.id).map((e) => e.capability_area),
          ),
        ] as CapabilityArea[],
      };
    });

  // People.
  const reauthIds = new Set(d.connections.filter((c) => c.status === "needs_reauthorization").map((c) => c.user_id));
  const people = auth.members.map((m) => {
    const ev = evBy.get(m.id) ?? [];
    const { progress, development } = personProgress(ev, now);
    const mine = d.interviews.filter((i) => i.interviewer_id === m.id);
    const eligible = mine.filter((i) => isEligible(i, members, from, to));
    const done = eligible.filter((i) => latest.get(i.id)?.status === "completed");
    const upcoming = mine
      .filter((i) => i.status !== "cancelled" && new Date(i.starts_at).getTime() >= now)
      .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
    const upcomingNeedsAction = upcoming.filter((i) => latest.get(i.id)?.status !== "completed").length;
    const allDone = d.sessions.filter((s) => s.interviewer_id === m.id && s.status === "completed");
    const lastPrep = allDone.map((s) => s.completed_at!).sort().at(-1) ?? null;
    const last = lastEvidence(progress);
    const ach = d.achievements.filter((x) => x.user_id === m.id).sort((a, b) => b.earned_at.localeCompare(a.earned_at));
    const { strongest, priority } = strongestAndPriority(progress);
    const devPriority = development.find((x) => x.status === "active" || x.status === "emerging");
    return {
      id: m.id,
      name: m.name,
      upcoming: upcoming.length,
      upcomingNeedsAction,
      nextInterview: upcoming[0] ? { startsAt: upcoming[0].starts_at, stage: upcoming[0].interview_stage, role: upcoming[0].role_title } : null,
      lastPrepAt: lastPrep,
      completedPreps: allDone.length,
      eligible: eligible.length,
      coverage: ratio(done.length, eligible.length),
      onTime: ratio(eligible.filter((i) => completedBeforeStart(i, latest.get(i.id))).length, eligible.length),
      fourArea: hasFourAreaCoverage(progress),
      strongest,
      priority: devPriority?.area ?? priority,
      level: professionalLevel(progress, allDone.length),
      recognition: ach[0] ? ACHIEVEMENT_NAMES[ach[0].achievement_code] ?? ach[0].achievement_code : null,
      recognitionAll: ach.map((x) => ({ code: x.achievement_code, name: ACHIEVEMENT_NAMES[x.achievement_code] ?? x.achievement_code.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()), earnedAt: x.earned_at })),
      lastEvidenceAt: last,
      currentEvidence: hasCurrentEvidence(last, now),
      building: progress.every((p) => p.mastery_stage === "building"),
      needsReauth: reauthIds.has(m.id),
      progress,
      development,
      recommendation: recommendNext({ progress, development, upcomingStage: upcoming[0]?.interview_stage, now }),
      evidence: ev,
    };
  });

  const metrics = computeReadinessMetrics({ interviews: d.interviews, sessions: d.sessions, deliveries: d.deliveries, members, from, to, now });
  const team = aggregateTeam(people.map((p) => ({ progress: p.progress, evidence: p.evidence })));
  const attention = buildAttention({
    rows: interviewRows.map((r) => ({ interview: d.interviews.find((i) => i.id === r.id)!, status: r.status, interviewerName: r.interviewer })),
    people,
    reauth: people.filter((p) => p.needsReauth).map((p) => p.name),
    now,
  });
  // Team-level development theme (suppressed below the group threshold).
  const devCounts = new Map<string, number>();
  for (const p of people) for (const x of p.development.filter((y) => y.status === "active")) devCounts.set(x.area, (devCounts.get(x.area) ?? 0) + 1);
  const topTeamDev = [...devCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topTeamDev && people.length >= MIN_AGGREGATE_GROUP)
    attention.push({
      kind: "team_theme",
      what: `${AREA_LABELS[topTeamDev[0] as CapabilityArea]} is the most common team development area.`,
      why: `${topTeamDev[1]} interviewer${topTeamDev[1] === 1 ? " has" : "s have"} a repeated gap here.`,
      who: [],
      action: "Consider a short team calibration session on this capability.",
    });

  // Recent meaningful activity (no per-question noise).
  const activity = [
    ...d.sessions
      .filter((s) => s.status === "completed" && s.completed_at)
      .map((s) => ({ at: s.completed_at!, text: `${nameOf.get(s.interviewer_id) ?? "Member"} completed a preparation` })),
    ...d.achievements.map((x) => ({ at: x.earned_at, text: `${nameOf.get(x.user_id) ?? "Member"} earned “${ACHIEVEMENT_NAMES[x.achievement_code] ?? x.achievement_code.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase())}”` })),
    ...interviewRows
      .filter((r) => r.status === "not_completed" && r.eligible)
      .map((r) => ({ at: r.startsAt, text: `${r.interviewer}'s ${r.stage.toLowerCase()} happened without completed preparation` })),
    ...people
      .flatMap((p) => p.development.filter((x) => x.status === "improving" || x.status === "resolved").map((x) => ({ at: x.lastConfirmed ?? "", text: `${p.name} is improving in ${x.subSkill.replace(/_/g, " ")}` }))),
    ...people.filter((p) => p.needsReauth).map((p) => ({ at: new Date(now).toISOString(), text: `${p.name} needs to reconnect Google Calendar` })),
  ]
    .filter((x) => x.at && new Date(x.at).getTime() <= now)
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 12);

  // Program health.
  const repeatPrep = metrics.repeatRate;
  const att = d.attachments;
  const connOk = d.connections.filter((c) => c.status === "active").length;
  const connBad = d.connections.filter((c) => c.status === "error" || c.status === "needs_reauthorization").length;
  const withCtx = d.interviews.filter((i) => isEligible(i, members, from, to) && (i.context_score ?? 0) >= 30).length;
  const program = {
    detected: d.detected.filter((x) => x.classification_status !== "not_interview").length,
    eligible: metrics.eligible,
    confirmed: d.interviews.filter((i) => i.confirmation_status === "confirmed" && i.status !== "cancelled" && new Date(i.starts_at).getTime() >= from && new Date(i.starts_at).getTime() <= to).length,
    funnel: computeFunnel({ interviews: d.interviews, sessions: d.sessions, deliveries: d.deliveries, members, from, to }),
    medianPrepMinutes: metrics.medianPrepMinutes,
    repeatRate: repeatPrep,
    startRate: metrics.startRate,
    completionRate: metrics.completionRate,
    fourArea: ratio(people.filter((p) => p.fourArea).length, people.length),
    currentEvidence: ratio(people.filter((p) => p.currentEvidence).length, people.length),
    building: ratio(people.filter((p) => p.building).length, people.length),
    integration: ratio(connOk, connOk + connBad),
    context: ratio(withCtx, metrics.eligible),
    attachments: ratio(att.filter((x) => x.processing_status === "extracted").length, att.filter((x) => ["extracted", "failed"].includes(x.processing_status)).length),
    attachmentFailures: att.filter((x) => x.processing_status === "failed").length,
  };

  // Strip raw evidence before returning to the browser.
  const peopleOut = people.map(({ evidence: _e, ...rest }) => rest);
  return {
    ...base,
    empty: false as const,
    metrics: {
      ...metrics,
      activeInterviewers: people.filter((p) => p.lastPrepAt && now - new Date(p.lastPrepAt).getTime() <= 30 * DAY).length,
      members: people.length,
      currentEvidence: program.currentEvidence,
      fourArea: program.fourArea,
    },
    attention,
    team,
    activity,
    interviews: interviewRows,
    people: peopleOut,
    program,
  };
}

/** Capability drill-down for one area. */
export async function getCapabilityDetail(sb: DB, userId: string, area: CapabilityArea) {
  const auth = await requireOwnedInterviewerGroup(sb, userId);
  if (!auth) return null;
  const now = Date.now();
  const memberIds = auth.members.map((m) => m.id);
  if (!memberIds.length) return { area, suppressed: true, contributors: 0 } as const;
  const a = await admin();
  const ev = (await inChunks(memberIds, (ids) =>
    a
      .from("capability_evidence")
      .select("user_id, capability_area, sub_skill, is_correct, difficulty, recorded_at, prep_session_id, prep_question_id")
      .in("user_id", ids)
      .eq("capability_area", area)
      .gte("recorded_at", new Date(now - EVIDENCE_LOOKBACK_DAYS * DAY).toISOString()),
  )) as (EvidenceItem & { user_id: string })[];
  const qIds = [...new Set(ev.map((e) => e.prep_question_id).filter(Boolean) as string[])];
  const qs = await inChunks(qIds, (ids) => a.from("prep_questions").select("id, interview_stage").in("id", ids));
  const stageOf = new Map(qs.map((q) => [q.id, q.interview_stage ?? "Unspecified"]));
  const by = evidenceByUser(ev);
  const people = memberIds.map((id) => ({ ...personProgress(by.get(id) ?? [], now), evidence: by.get(id) ?? [] }));
  const [team] = aggregateTeam(people.map((p) => ({ progress: p.progress.filter((x) => x.capability_area === area).concat(p.progress.filter((x) => x.capability_area !== area)), evidence: p.evidence }))).filter((t) => t.area === area);
  if (!team || team.suppressed) return { area, suppressed: true, contributors: team?.contributors ?? 0, evidence: ev.length, confidence: team?.confidence } as const;

  const subs = new Map<string, { total: number; correct: number; recentT: number; recentC: number; priorT: number; priorC: number }>();
  const W = 60 * DAY;
  for (const e of ev) {
    const k = e.sub_skill ?? "unspecified";
    const s = subs.get(k) ?? { total: 0, correct: 0, recentT: 0, recentC: 0, priorT: 0, priorC: 0 };
    s.total++;
    if (e.is_correct) s.correct++;
    const age = now - new Date(e.recorded_at).getTime();
    if (age <= W) { s.recentT++; if (e.is_correct) s.recentC++; }
    else if (age <= 2 * W) { s.priorT++; if (e.is_correct) s.priorC++; }
    subs.set(k, s);
  }
  const subSkills = [...subs.entries()].map(([sub, s]) => {
    const comparable = s.recentT >= 5 && s.priorT >= 5;
    const change = comparable ? Math.round((s.recentC / s.recentT - s.priorC / s.priorT) * 100) : null;
    return { subSkill: sub, total: s.total, accuracy: Math.round((s.correct / s.total) * 100), misses: s.total - s.correct, change };
  });
  const stages = new Map<string, { total: number; misses: number }>();
  for (const e of ev) {
    const st = (e.prep_question_id && stageOf.get(e.prep_question_id)) || "Unspecified";
    const x = stages.get(st) ?? { total: 0, misses: 0 };
    x.total++;
    if (!e.is_correct) x.misses++;
    stages.set(st, x);
  }
  // Monthly trend (only months with ≥ MIN_AGGREGATE_GROUP×2 answers are plotted).
  const months = new Map<string, { t: number; c: number }>();
  for (const e of ev) {
    const k = e.recorded_at.slice(0, 7);
    const x = months.get(k) ?? { t: 0, c: 0 };
    x.t++;
    if (e.is_correct) x.c++;
    months.set(k, x);
  }
  const worst = [...subSkills].sort((a, b) => a.accuracy - b.accuracy)[0];
  return {
    area,
    suppressed: false as const,
    team,
    subSkills: subSkills.sort((a, b) => b.misses - a.misses),
    mostImproved: subSkills.filter((s) => (s.change ?? 0) > 10).sort((a, b) => (b.change ?? 0) - (a.change ?? 0)).slice(0, 3),
    stages: [...stages.entries()].map(([stage, x]) => ({ stage, total: x.total, missRate: Math.round((x.misses / x.total) * 100) })).sort((a, b) => b.total - a.total),
    trend: [...months.entries()].sort().map(([month, x]) => ({ month, answers: x.t, accuracy: x.t >= MIN_AGGREGATE_GROUP * 2 ? Math.round((x.c / x.t) * 100) : null })),
    focus: worst ? `Run a short calibration on ${worst.subSkill.replace(/_/g, " ")} — the lowest-accuracy sub-skill (${worst.accuracy}% across ${worst.total} answers).` : null,
  };
}

/** Individual profile for a group member (owner-authorized) — no candidate details. */
export async function getMemberProfile(sb: DB, userId: string, memberId: string) {
  const auth = await requireOwnedInterviewerGroup(sb, userId);
  if (!auth || !auth.members.some((m) => m.id === memberId)) throw new Error("Not authorized to view this profile");
  return buildProfile(memberId, auth.members.find((m) => m.id === memberId)!.name);
}

/** Participant's own profile. */
export async function getOwnProfile(userId: string) {
  const a = await admin();
  const { data: p } = await a.from("profiles").select("display_name, full_name").eq("id", userId).maybeSingle();
  return buildProfile(userId, p?.display_name || p?.full_name || "You");
}

async function buildProfile(memberId: string, name: string) {
  const a = await admin();
  const now = Date.now();
  const [{ data: ivs }, { data: ev }, { data: ach }] = await Promise.all([
    a
      .from("interview_events")
      .select("id, interviewer_id, role_title, interview_stage, starts_at, created_at, status, confirmation_status, source")
      .eq("interviewer_id", memberId)
      .gte("starts_at", new Date(now - MAX_RANGE_DAYS * DAY).toISOString())
      .order("starts_at", { ascending: false })
      .limit(200),
    a
      .from("capability_evidence")
      .select("capability_area, sub_skill, is_correct, difficulty, recorded_at, prep_session_id, prep_question_id")
      .eq("user_id", memberId)
      .gte("recorded_at", new Date(now - EVIDENCE_LOOKBACK_DAYS * DAY).toISOString()),
    a.from("user_achievements").select("achievement_code, earned_at").eq("user_id", memberId),
  ]);
  const ids = (ivs ?? []).map((i) => i.id);
  const [sessions, contexts] = await Promise.all([
    inChunks(ids, (x) => a.from("prep_sessions").select("id, interview_event_id, interviewer_id, status, generated_at, started_at, completed_at, overall_score, correct_answers, total_questions").in("interview_event_id", x)),
    inChunks(ids, (x) => a.from("interview_contexts").select("interview_event_id, context_completeness_score, context_sources").in("interview_event_id", x)),
  ]);
  const ctxBy = new Map(contexts.map((c) => [c.interview_event_id, c]));
  const interviews: InterviewRow[] = (ivs ?? []).map((i) => ({ ...i, context_score: ctxBy.get(i.id)?.context_completeness_score ?? null }));
  const latest = latestSessions(sessions as SessionRow[]);
  const evidence = (ev ?? []) as EvidenceItem[];
  const { progress, development } = personProgress(evidence, now);
  const members = new Set([memberId]);
  const from = now - MAX_RANGE_DAYS * DAY;
  const eligible = interviews.filter((i) => isEligible(i, members, from, now + 365 * DAY));
  const upcoming = interviews.filter((i) => i.status !== "cancelled" && new Date(i.starts_at).getTime() >= now).sort((x, y) => x.starts_at.localeCompare(y.starts_at));
  const allDone = (sessions as (SessionRow & { overall_score: number | null })[]).filter((s) => s.status === "completed");
  const lastPrep = allDone.map((s) => s.completed_at!).sort().at(-1) ?? null;
  const last = lastEvidence(progress);
  const next = upcoming[0];

  // Incorrect-answer themes: sub-skills missed in the last 60 days (no question text).
  const recentMisses = new Map<string, number>();
  for (const e of evidence) if (!e.is_correct && now - new Date(e.recorded_at).getTime() <= 60 * DAY && e.sub_skill) recentMisses.set(e.sub_skill, (recentMisses.get(e.sub_skill) ?? 0) + 1);

  return {
    name,
    summary: {
      nextInterview: next ? { startsAt: next.starts_at, stage: next.interview_stage, role: next.role_title } : null,
      nextPrepStatus: next ? latest.get(next.id)?.status ?? "not_generated" : null,
      lastPrepAt: lastPrep,
      completedPreps: allDone.length,
      eligible: eligible.length,
      coverage: ratio(eligible.filter((i) => latest.get(i.id)?.status === "completed").length, eligible.length),
      onTime: ratio(eligible.filter((i) => completedBeforeStart(i, latest.get(i.id))).length, eligible.length),
      level: professionalLevel(progress, allDone.length),
      lastEvidenceAt: last,
      currentEvidence: hasCurrentEvidence(last, now),
    },
    progress,
    development,
    recentThemes: [...recentMisses.entries()].sort((x, y) => y[1] - x[1]).slice(0, 5).map(([subSkill, misses]) => ({ subSkill, misses })),
    recommendation: recommendNext({ progress, development, upcomingStage: next?.interview_stage, now }),
    history: interviews.slice(0, 50).map((i) => {
      const s = latest.get(i.id) as (SessionRow & { correct_answers: number | null; total_questions: number }) | undefined;
      return {
        id: i.id,
        startsAt: i.starts_at,
        role: i.role_title,
        stage: i.interview_stage,
        status: interviewStatus(i, s, [], now),
        completedAt: s?.completed_at ?? null,
        onTime: completedBeforeStart(i, s),
        areas: [...new Set(evidence.filter((e) => s && e.prep_session_id === s.id).map((e) => e.capability_area))],
        result: s?.status === "completed" && s.correct_answers !== null ? `${s.correct_answers} of ${s.total_questions} correct` : null,
        contextSources: ((ctxBy.get(i.id)?.context_sources as string[] | null) ?? []).map((x) => String(x)),
      };
    }),
    recognition: (ach ?? []).map((x) => ({ code: x.achievement_code, name: ACHIEVEMENT_NAMES[x.achievement_code] ?? x.achievement_code.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()), earnedAt: x.earned_at })),
  };
}

/** Privacy-safe CSV export, logged to readiness_exports. */
export async function exportReadiness(
  sb: DB,
  userId: string,
  input: { type: "interview_operations" | "team_capability" | "individual_capability"; from?: string | undefined; to?: string | undefined },
) {
  const dash = await getReadinessDashboard(sb, userId, input);
  if (!dash) throw new Error("Only group owners can export readiness data");
  let rows: Record<string, string | number | null>[] = [];
  if (!dash.empty) {
    if (input.type === "interview_operations")
      rows = dash.interviews.map((r) => ({
        interview_start: r.startsAt,
        interviewer: r.interviewer,
        role: r.role,
        stage: r.stage,
        source: r.source,
        context_status: r.contextStatus,
        preparation_status: r.status,
        eligible: r.eligible ? "yes" : "no",
        delivery_status: r.deliveryStatus,
        completed_at: r.completedAt,
        completed_before_start: r.onTime ? "yes" : "no",
        duration_minutes: r.durationMinutes,
      }));
    else if (input.type === "team_capability")
      rows = dash.team.map((t) => ({
        capability: AREA_LABELS[t.area],
        team_score: t.suppressed ? "Not enough data" : t.score,
        contributing_interviewers: t.contributors,
        building_profile_excluded: t.excludedBuilding,
        answers: t.evidence,
        direction: t.direction,
      }));
    else
      rows = dash.people.flatMap((p) =>
        p.progress.map((x) => ({
          interviewer: p.name,
          capability: AREA_LABELS[x.capability_area],
          answers: x.total_questions,
          correct: x.correct_answers,
          weighted_score: x.mastery_stage === "building" ? "Building profile" : x.weighted_score,
          confidence: x.evidence_confidence,
          stage: x.mastery_stage,
          direction: x.recent_direction,
          last_evidence: x.last_evidence_at,
        })),
      );
  }
  const csv = toCsv(rows);
  const a = await admin();
  await a.from("readiness_exports").insert({
    user_id: userId,
    group_id: dash.group.id,
    export_type: input.type,
    range_from: dash.range.from,
    range_to: dash.range.to,
    row_count: rows.length,
  });
  return { csv, rows: rows.length, filename: `benchmark-${input.type}-${dash.range.from.slice(0, 10)}.csv` };
}

export { CAPABILITY_AREAS };
