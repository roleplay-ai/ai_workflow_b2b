import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },

  serverExternalPackages: ["@napi-rs/canvas", "pdfjs-dist"],

  turbopack: {},
};

export default nextConfig;
