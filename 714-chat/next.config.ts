import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      // Supabase Storage (avatars + chat uploads)
      {
        protocol: "https",
        hostname: "vabjuvmglxsafknthscy.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },

      // Tenor GIFs
      {
        protocol: "https",
        hostname: "media.tenor.com",
        port: "",
        pathname: "/**",
      },

      // Giphy fallback
      {
        protocol: "https",
        hostname: "media.giphy.com",
        port: "",
        pathname: "/**",
      },

      // Common OAuth avatars (GitHub, Google, Discord)
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
        port: "",
        pathname: "/**",
      },

      // ✅ Add postimg.cc (for your 714.jpg image)
      {
        protocol: "https",
        hostname: "i.postimg.cc",
        port: "",
        pathname: "/**",
      },
    ],
    formats: ["image/avif", "image/webp"], // better compression
  },

  // Optional security and optimization headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
    ];
  },

  eslint: {
    ignoreDuringBuilds: true, // optional for Supabase quick builds
  },

  typescript: {
    ignoreBuildErrors: true, // optional: prevents build block while prototyping
  },
};

export default nextConfig;
