import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Pichichi — El prode del Mundial 2026',
    short_name: 'Pichichi',
    description:
      'Armá tu grupo, predecí los scores y demostrá que sabés más de fútbol. El prode oficial del Mundial 2026.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0B6E4F',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
