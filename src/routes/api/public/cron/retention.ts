import { createFileRoute } from '@tanstack/react-router'

async function authorized(request: Request) {
  const match = /^Bearer ([^\s,]+)$/.exec(request.headers.get('authorization') ?? '')
  const token = match?.[1]
  if (!token) return false
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const { data } = await supabaseAdmin.from('cron_tokens').select('token').eq('name', 'calendar-sync').maybeSingle()
  return Boolean(data?.token) && data!.token === token
}

export const Route = createFileRoute('/api/public/cron/retention')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!(await authorized(request))) return new Response('Unauthorized', { status: 401 })
        try {
          const { runRetention } = await import('@/lib/governance.server')
          return Response.json(await runRetention())
        } catch (e) {
          console.error('[retention] failed', (e as Error).message)
          return new Response('Retention failed', { status: 500 })
        }
      },
    },
  },
})
