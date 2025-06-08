import withPWA from 'next-pwa'

const nextConfig = {
  reactStrictMode: true,
  output: 'export', // exportação estática
  images: {
    unoptimized: true, // desativa otimização automática
  }
}

export default withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  buildExcludes: [/middleware-manifest\.json$/],
})(nextConfig);
