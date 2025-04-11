import type { NextConfig } from "next";

const isProduction = false;

const nextConfig: NextConfig = {
  env: {
    API_URL: isProduction
      ? "https://api.loqui.imb11.dev/"
      : "http://127.0.0.1:8080/",
    CURRENT_URL: isProduction
      ? "https://loqui.imb11.dev/"
      : "http://127.0.0.1:3000/",
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
