import type { MetadataRoute } from 'next';

// GEO-friendly robots: allow ALL crawlers (including AI bots like
// GPTBot, PerplexityBot, ClaudeBot, Google Extended, Bingbot) so the
// business entity is discoverable by both classic search engines and
// generative engines. No js/css blocking.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
      },
    ],
    sitemap: 'https://fairway.upstatewebsites.com/sitemap.xml',
    host: 'https://fairway.upstatewebsites.com',
  };
}
