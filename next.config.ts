import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable ESLint during production builds
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript type checking during builds
  typescript: {
    ignoreBuildErrors: true,
  },

  // Required for SharedArrayBuffer support (used by PowerSync OPFS/SharedWorker)
  // and WASM loading. Without these headers, SharedWorker multi-tab sync fails.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
    ];
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        net: false,
        tls: false,
      };
    }

    // Needed to handle .wasm files from @journeyapps/wa-sqlite
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    return config;
  },
};

export default nextConfig;

