/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: {
    domains: ['i.ibb.co', 'images.unsplash.com'],
    unoptimized: false,
  },
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  // Configuração experimental única
  experimental: { esmExternals: false },
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  },
  async headers() {
    return [
      {
        source: '/uploads/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },
  webpack: (config, { isServer }) => {
    // Evitar que o Next tente resolver módulos do Node no client
    config.resolve = config.resolve || {}
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    }

    // Tratar jspdf no lado do servidor
    if (isServer) {
      config.externals = config.externals || []
      config.externals.push({ jspdf: 'commonjs jspdf' })
    }

    return config
  },
}

export default nextConfig
