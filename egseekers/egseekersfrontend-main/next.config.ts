import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // ⚠️ This allows production builds to successfully complete
    // even if your code has ESLint errors.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
