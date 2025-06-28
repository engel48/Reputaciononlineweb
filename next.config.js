/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuraciones estándar
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone', // Required for Docker deployment
  images: {
    domains: ['localhost', 'graph.facebook.com', 'pbs.twimg.com', 'media.licdn.com', 'yt3.ggpht.com'],
  }
};

module.exports = nextConfig;
