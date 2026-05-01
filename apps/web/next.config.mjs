/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ["@agentbazaar/types", "@agentbazaar/database"],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
    env: {
    // Note: Secrets removed for security. 
    // Manage these via Vercel / VPS Environment Variables.
    OG_RPC_URL: "https://evmrpc.0g.ai",
    OG_INDEXER_URL: "https://indexer-storage-mainnet-standard.0g.ai",
    OG_CONTRACT_ADDRESS: "0x02DF8a5934dA46859962bd4962668d109d544457",
    OG_NETWORK: "mainnet",
  },
  optimizeFonts: false,
  async rewrites() {
      return {
        afterFiles: [
          {
            source: '/api/:path*',
            destination: process.env.NODE_ENV === 'production' 
              ? '/api/:path*' // Point to the same origin in production
              : 'http://localhost:3005/:path*', // Local dev
          },
        ],
      };
    },
};

export default nextConfig;
