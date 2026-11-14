import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // Arena live previews are served from https://{port}-{sandboxId}.e2b.app —
  // allow any such host so dev assets load cross-origin (dev-only setting).
  allowedDevOrigins: ["**.e2b.app"],
};

export default nextConfig;
