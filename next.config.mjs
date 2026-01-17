/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Suppress hydration warnings caused by browser extensions
  reactStrictMode: true,
  compiler: {
    removeConsole: false,
  },
}

export default nextConfig
