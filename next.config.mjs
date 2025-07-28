/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['i.ibb.co'],
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
  experimental: {
    esmExternals: 'loose',
  },
}

export default nextConfig
