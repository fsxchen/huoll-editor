import type { NextConfig } from "next";

const isTauriBuild = process.env.NEXT_PUBLIC_TAURI_BUILD === "1";

const nextConfig: NextConfig = {
  output: isTauriBuild ? "export" : undefined,
  distDir: isTauriBuild ? "dist" : ".next",
  images: {
    unoptimized: isTauriBuild,
  },
};

export default nextConfig;
