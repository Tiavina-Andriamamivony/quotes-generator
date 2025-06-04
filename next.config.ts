/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
    dirs: ['app', 'lib', 'components']
  },
  typescript: {
    ignoreBuildErrors: true
  },
  images: {
    unoptimized: true,
  }
}

export default nextConfig
