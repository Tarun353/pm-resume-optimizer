/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['puppeteer-core', 'mammoth', '@sparticuz/chromium-min'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [
        ...(config.externals || []), 
        'puppeteer-core', 
        'mammoth',
        '@sparticuz/chromium-min'
      ];
    }
    return config;
  },
};

module.exports = nextConfig;
