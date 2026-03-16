/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['puppeteer', 'mammoth', 'pdf-parse'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [
        ...(config.externals || []),
        'puppeteer',
        'mammoth',
        'pdf-parse',
      ];
    }
    return config;
  },
};

module.exports = nextConfig;
