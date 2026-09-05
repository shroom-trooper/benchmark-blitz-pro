import { createFileRoute } from '@tanstack/react-router'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/integrations/supabase/types'

function publicClient() {
  const key = process.env['SUPABASE_PUBLISHABLE_KEY']!
  const url = process.env['SUPABASE_URL']!
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers)
        if (key.startsWith('sb_') && h.get('Authorization') === `Bearer ${key}`)
          h.delete('Authorization')
        h.set('apikey', key)
        return fetch(input, { ...init, headers: h })
      },
    },
  })
}

function base64ToBytes(b64: string) {
  const clean = b64.replace(/^data:image\/png;base64,/, '')
  const binary = atob(clean)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

export const Route = createFileRoute('/api/public/og/$slug')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const slug = params.slug.replace(/\.png$/, '')
        const { data, error } = await publicClient().rpc('get_share_card', {
          p_slug: slug,
        })
        if (error || !data) return new Response('Not found', { status: 404 })
        return new Response(base64ToBytes(data), {
          headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'public, max-age=300',
          },
        })
      },
    },
  },
})
