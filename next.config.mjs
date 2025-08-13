/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['i.ibb.co', 'images.unsplash.com'],
    unoptimized: false,
  },
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  experimental: {
    esmExternals: true,
  },
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
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
   // Configurações experimentais
  experimental: {
    esmExternals: false, // Mudou de 'loose' para false para evitar erros
  },
  webpack: (config, { isServer }) => {
<<<<<<< HEAD
    // Resolver problemas com módulos que não funcionam no servidor
    if (isServer) {
      config.externals = config.externals || []
      config.externals.push({
        'jspdf': 'commonjs jspdf',
      })
    }
    
    // Resolver problemas com módulos que causam erro de length
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      'jspdf': 'commonjs jspdf',
    }
    
    // Resolver problemas com módulos que causam erro de length
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
=======
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      }
>>>>>>> 51c583dc6aed85819b3d4fc1c5ef7f1a58749f03
    }
    
    return config
  },
}

export default nextConfig
