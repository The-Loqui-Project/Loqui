import type { NextConfig } from "next";

const isProduction = !process.env.IS_DEV_MODE;

const nextConfig: NextConfig = {
  env: {
    API_URL: process.env.API_URL,
    CURRENT_URL: process.env.CURRENT_URL,
    NEXT_PUBLIC_API_URL: process.env.API_URL,
    NEXT_PUBLIC_CURRENT_URL: process.env.CURRENT_URL,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
        port: "",
        pathname: "**",
      },
    ],
  },
};

export default nextConfig;
