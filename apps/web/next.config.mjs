/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ["@agentbazaar/types", "@agentbazaar/database"],
    async rewrites() {
      return {
        afterFiles: [
          {
            source: '/api/:path*',
            destination: 'http://localhost:3006/:path*',
          },
        ],
      };
    },
};

export default nextConfig;
