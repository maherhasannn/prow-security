/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production'
const isGitHubPages = process.env.GITHUB_PAGES === 'true'
const isGCP = process.env.GCP_DEPLOY === 'true'

const nextConfig = {
  reactStrictMode: true,
  // Use static export for GitHub Pages, standalone for GCP Cloud Run
  ...(isGitHubPages && {
    output: 'export',
    basePath: '/prow-security',
    assetPrefix: '/prow-security',
  }),
  // Enable standalone output for Cloud Run
  ...(isGCP && {
    output: 'standalone',
  }),
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig









