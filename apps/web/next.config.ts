import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    API_URL: process.env.PRODUCTION
      ? "https://api.loqui.imb11.dev/"
      : "http://localhost:8080/",
    CURRENT_URL: process.env.PRODUCTION
      ? "https://loqui.imb11.dev/"
      : "http://localhost:3000/",
  },
};

export default nextConfig;
