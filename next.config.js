/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config, { dev, isServer }) => {
    // Force production mode for React
    if (!dev) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'react': 'react/cjs/react.production.min.js',
        'react-dom': 'react-dom/cjs/react-dom.production.min.js',
      }
    }
    return config
  }
}

module.exports = nextConfig 