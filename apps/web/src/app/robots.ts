import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: 'https://pichichi.app/sitemap.xml',
    host: 'https://pichichi.app',
  }
}
