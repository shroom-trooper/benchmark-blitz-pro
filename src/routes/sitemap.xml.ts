import { createFileRoute } from '@tanstack/react-router'
import type {} from '@tanstack/react-start'

const BASE_URL = 'https://usebenchmark.app'

interface SitemapEntry {
  path: string
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: string
}

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: '/', changefreq: 'weekly', priority: '1.0' },
          { path: '/leaderboard', changefreq: 'daily', priority: '0.7' },
          { path: '/guides/how-to-train-hiring-managers', changefreq: 'monthly', priority: '0.8' },
        ]

        const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

        const pageSize = 1000
        for (let offset = 0; ; offset += pageSize) {
          const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('share_slug')
            .not('share_slug', 'is', null)
            .order('share_slug')
            .range(offset, offset + pageSize - 1)

          if (error) {
            console.error('[sitemap] failed to load profile slugs', error)
            throw error
          }

          entries.push(
            ...data.map((p) => ({
              path: `/p/${encodeURIComponent(p.share_slug!)}`,
              changefreq: 'weekly' as const,
              priority: '0.6',
            })),
          )

          if (data.length < pageSize) break
        }

        const urls = entries
          .map(
            (e) =>
              [
                '  <url>',
                `    <loc>${BASE_URL}${e.path}</loc>`,
                e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
                e.priority ? `    <priority>${e.priority}</priority>` : null,
                '  </url>',
              ]
                .filter(Boolean)
                .join('\n'),
          )
          .join('\n')

        const xml = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
          urls,
          '</urlset>',
        ].join('\n')

        return new Response(xml, {
          headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, max-age=3600',
          },
        })
      },
    },
  },
})
