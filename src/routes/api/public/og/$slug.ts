import { createFileRoute } from '@tanstack/react-router'

// Phase 5: public share cards are retired. Old image links fall back to the site icon.
export const Route = createFileRoute('/api/public/og/$slug')({
  server: {
    handlers: {
      GET: async () =>
        new Response(null, { status: 302, headers: { Location: '/favicon.png' } }),
    },
  },
})
