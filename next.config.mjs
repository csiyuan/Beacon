/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['three'],
  // Hide the Next.js dev-mode badge (bottom-right "N") + the static/dynamic
  // route indicator. Dev-only chrome; doesn't ship to production.
  devIndicators: {
    buildActivity: false,
    appIsrStatus: false,
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      type: 'asset/source',
    });
    return config;
  },
};

export default nextConfig;
