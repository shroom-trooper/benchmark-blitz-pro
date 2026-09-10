import { createFileRoute } from '@tanstack/react-router'

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
        const { supabaseAdmin } = await import(
          '@/integrations/supabase/client.server'
        )
        const { data, error } = await supabaseAdmin.rpc('get_share_card', {
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
