/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['puppeteer', 'mammoth', '@sparticuz/chromium'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [
        ...(config.externals || []), 
        'puppeteer', 
        'mammoth',
        '@sparticuz/chromium'
      ];
    }
    return config;
  },
};

module.exports = nextConfig;
