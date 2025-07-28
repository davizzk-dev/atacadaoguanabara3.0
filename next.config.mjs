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
    unoptimized: true, // Para build estático
  },
  // Configuração para build estático
  // output: 'export', // Comentado temporariamente
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  // Desabilitar otimizações que causam problemas no build estático
  experimental: {
    esmExternals: 'loose',
  },
  webpack: (config, { isServer }) => {
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
      crypto: false,
    }
    
    return config
  },
}

export default nextConfig
