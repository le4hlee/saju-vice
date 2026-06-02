import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow HMR when opening dev server via LAN IP (e.g. phone or another machine)
  allowedDevOrigins: ["172.20.20.20"],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
