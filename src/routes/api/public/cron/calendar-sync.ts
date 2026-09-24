import { createFileRoute } from '@tanstack/react-router'

async function authorized(request: Request) {
  const match = /^Bearer ([^\s,]+)$/.exec(request.headers.get('authorization') ?? '')
  const token = match?.[1]
  if (!token) return false
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const { data } = await supabaseAdmin.from('cron_tokens').select('token').eq('name', 'calendar-sync').maybeSingle()
  return Boolean(data?.token) && data!.token === token
}

async function run() {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const sync = await import('@/lib/calendar/sync.server')
  const { data: conns } = await supabaseAdmin
    .from('calendar_connections')
    .select('user_id')
    .in('status', ['active', 'error'])
    .limit(200)
  const results = { synced: 0, failed: 0, reauth: 0 }
  for (const c of conns ?? []) {
    const r = await sync.syncUser(c.user_id)
    if (r.status === 'ok') results.synced++
    else if (r.status === 'needs_reauthorization') results.reauth++
    else results.failed++
  }
  const deliveries = await sync.processDueDeliveries()
  const purged = await sync.purgeExpiredAttachmentContent()
  return { ...results, ...deliveries, purged }
}

export const Route = createFileRoute('/api/public/cron/calendar-sync')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!(await authorized(request))) return new Response('Unauthorized', { status: 401 })
        try {
          return Response.json(await run())
        } catch (e) {
          console.error('[calendar-sync] failed', (e as Error).message)
          return new Response('error', { status: 500 })
        }
      },
    },
  },
})
