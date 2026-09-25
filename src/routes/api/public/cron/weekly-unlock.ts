import { createFileRoute } from '@tanstack/react-router'
import { authenticateCronRequest } from '@/integrations/supabase/cron-auth'
import { unlockedWeekFor } from '@/lib/gamification'
import { sendTemplateEmail } from '@/lib/email-templates/send-email'

const SITE_URL = 'https://usebenchmark.app'

async function hasDbCronToken(request: Request) {
  const match = /^Bearer ([^\s,]+)$/.exec(request.headers.get('authorization') ?? '')
  const token = match?.[1]
  if (!token) return false
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const { data } = await supabaseAdmin
    .from('cron_tokens')
    .select('token')
    .eq('name', 'weekly-unlock')
    .maybeSingle()
  return Boolean(data?.token) && data!.token === token
}

type Track = 'interviewer' | 'recruiter'

async function run() {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

  const [{ data: profiles }, { data: weeks }, { data: recruiterWeeks }, { data: progress }] =
    await Promise.all([
      supabaseAdmin
        .from('profiles')
        .select(
          'id, email, display_name, full_name, created_at, current_streak, allowed_tracks',
        ),
      supabaseAdmin.from('curriculum_weeks').select('week_number, topic'),
      supabaseAdmin.from('recruiter_weeks').select('week_number, topic'),
      supabaseAdmin
        .from('track_progress')
        .select('user_id, track, started_at, current_streak')
        .eq('track', 'recruiter'),
    ])

  const topicsByTrack: Record<Track, Map<number, string>> = {
    interviewer: new Map((weeks ?? []).map((w) => [w.week_number, w.topic])),
    recruiter: new Map((recruiterWeeks ?? []).map((w) => [w.week_number, w.topic])),
  }
  const recruiterProgress = new Map((progress ?? []).map((r) => [r.user_id, r]))

  let sent = 0
  let skipped = 0

  for (const p of profiles ?? []) {
    const allowed = (p.allowed_tracks ?? ['interviewer']) as Track[]

    for (const track of ['interviewer', 'recruiter'] as Track[]) {
      if (!allowed.includes(track) || !p.email) {
        skipped += 1
        continue
      }

      const rp = recruiterProgress.get(p.id)
      if (track === 'recruiter' && !rp) {
        // They have access but have not started the recruiter track yet.
        skipped += 1
        continue
      }

      const startedAt = track === 'recruiter' ? rp!.started_at : p.created_at
      const streak =
        (track === 'recruiter' ? rp!.current_streak : p.current_streak) ?? 0
      const week = unlockedWeekFor(startedAt)
      if (week < 2) {
        skipped += 1
        continue
      }

      // Idempotency: unique (user_id, week_number, track) prevents duplicates.
      const { error: claimError } = await supabaseAdmin
        .from('weekly_unlock_emails')
        .insert({ user_id: p.id, week_number: week, track })
      if (claimError) {
        skipped += 1
        continue
      }

      const path = track === 'recruiter' ? `recruiter/session/${week}` : `session/${week}`
      const fallbackTopic =
        track === 'recruiter'
          ? 'your next recruiting scenarios'
          : 'your next hiring simulation'

      try {
        await sendTemplateEmail('weekly-unlock', p.email, {
          templateData: {
            firstName: (p.display_name || p.full_name || '').split(' ')[0] || 'there',
            weekNumber: week,
            topic: topicsByTrack[track].get(week) ?? fallbackTopic,
            streak,
            sessionUrl: `${SITE_URL}/${path}`,
            track,
          },
          idempotencyKey: `weekly-unlock-${p.id}-${track}-${week}`,
        })
        sent += 1
      } catch (error) {
        console.error('[weekly-unlock] send failed', p.id, track, error)
        await supabaseAdmin
          .from('weekly_unlock_emails')
          .delete()
          .eq('user_id', p.id)
          .eq('week_number', week)
          .eq('track', track)
      }
    }
  }

  return { sent, skipped }
}

export const Route = createFileRoute('/api/public/cron/weekly-unlock')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = await authenticateCronRequest(request)
        if (denied && !(await hasDbCronToken(request))) return denied
        return Response.json(await run())
      },
    },
  },
})
