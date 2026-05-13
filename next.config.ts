import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['busboy'],
  experimental: {
    proxyClientMaxBodySize: 200 * 1024 * 1024, // 200MB
  },
};

export default nextConfig;
