import { createFileRoute } from '@tanstack/react-router'
import { authenticateCronRequest } from '@/integrations/supabase/cron-auth'
import { unlockedWeekFor } from '@/lib/benchmark.server'
import { sendTemplateEmail } from '@/lib/email-templates/send-email'

const SITE_URL = 'https://usebenchmark.app'

async function run() {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

  const [{ data: profiles }, { data: weeks }] = await Promise.all([
    supabaseAdmin
      .from('profiles')
      .select('id, email, display_name, full_name, created_at, current_streak'),
    supabaseAdmin.from('curriculum_weeks').select('week_number, topic'),
  ])

  const topics = new Map((weeks ?? []).map((w) => [w.week_number, w.topic]))
  let sent = 0
  let skipped = 0

  for (const p of profiles ?? []) {
    const week = unlockedWeekFor(p.created_at)
    if (week < 2 || !p.email) {
      skipped += 1
      continue
    }

    // Idempotency: the unique (user_id, week_number) index prevents duplicates.
    const { error: claimError } = await supabaseAdmin
      .from('weekly_unlock_emails')
      .insert({ user_id: p.id, week_number: week })
    if (claimError) {
      skipped += 1
      continue
    }

    try {
      await sendTemplateEmail('weekly-unlock', p.email, {
        templateData: {
          firstName: (p.display_name || p.full_name || '').split(' ')[0] || 'there',
          weekNumber: week,
          topic: topics.get(week) ?? 'your next hiring simulation',
          streak: p.current_streak ?? 0,
          sessionUrl: `${SITE_URL}/session/${week}`,
        },
        idempotencyKey: `weekly-unlock-${p.id}-${week}`,
      })
      sent += 1
    } catch (error) {
      console.error('[weekly-unlock] send failed', p.id, error)
      await supabaseAdmin
        .from('weekly_unlock_emails')
        .delete()
        .eq('user_id', p.id)
        .eq('week_number', week)
    }
  }

  return { sent, skipped }
}

export const Route = createFileRoute('/api/public/cron/weekly-unlock')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = await authenticateCronRequest(request)
        if (denied) return denied
        return Response.json(await run())
      },
    },
  },
})
