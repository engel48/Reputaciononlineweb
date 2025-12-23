/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuraciones estándar
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone', // Required for Docker deployment
  images: {
    domains: ['localhost', 'graph.facebook.com', 'pbs.twimg.com', 'media.licdn.com', 'yt3.ggpht.com'],
  },
  // Redirects para páginas de monitoreo antiguas
  async redirects() {
    return [
      {
        source: '/dashboard/busqueda-noticias',
        destination: '/dashboard/monitoreo?tab=news',
        permanent: false,
      },
      {
        source: '/dashboard/social-listening',
        destination: '/dashboard/monitoreo?tab=social',
        permanent: false,
      },
      {
        source: '/dashboard/hashtags',
        destination: '/dashboard/monitoreo?tab=hashtags',
        permanent: false,
      },
    ];
  },
  // Transpile problematic server-only packages
  experimental: {
    serverComponentsExternalPackages: ['cheerio', 'undici'],
  },
  // Exclude server-only dependencies from client bundle
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Mark server-only packages as externals for client bundle
      config.externals = config.externals || [];
      config.externals.push({
        undici: 'commonjs undici',
        cheerio: 'commonjs cheerio',
      });

      // Also set fallbacks
      config.resolve.fallback = {
        ...config.resolve.fallback,
        undici: false,
        cheerio: false,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
