/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production'
const isGCP = process.env.GCP_DEPLOY === 'true'

const nextConfig = {
  reactStrictMode: true,
  // Enable standalone output for GCP Cloud Run (good for dynamic backends)
  ...(isGCP && {
    output: 'standalone',
  }),
  // Note: Removed GitHub Pages static export - using dynamic backend instead
  images: {
    unoptimized: true,
  },
  // ESLint configuration for builds
  eslint: {
    ignoreDuringBuilds: false,
  },
  // TypeScript configuration for builds
  typescript: {
    ignoreBuildErrors: false,
  },
}

module.exports = nextConfig









