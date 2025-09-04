import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  redirects: async () => [
    {
      source: "/",
      destination: "/cw",
      permanent: true,
    },
  ],
};

export default nextConfig;
