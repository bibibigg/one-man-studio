import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      // Kling AI CDN for generated videos/images
      { protocol: 'https', hostname: '**.klingai.com' },
      { protocol: 'https', hostname: '**.klingai.io' },
    ],
  },
  // Next.js 16 uses Turbopack by default
  turbopack: {},
}

export default nextConfig
