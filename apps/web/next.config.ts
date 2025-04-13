import type { NextConfig } from "next";

const isProduction = !process.env.IS_DEV_MODE;

const nextConfig: NextConfig = {
  env: {
    API_URL: isProduction
      ? "https://api.loqui.imb11.dev/"
      : process.env.API_URL,
    CURRENT_URL: isProduction
      ? "https://loqui.imb11.dev/"
      : process.env.CURRENT_URL,
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
