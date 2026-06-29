import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root: a stray package-lock.json one level up (outside
  // this app) would otherwise make Turbopack guess the wrong root.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
