/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["images.clerk.dev"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        pathname: "/**", // Allow all images from this domain
      },
      {
        protocol: "https",
        hostname: "images.clerk.dev",
        pathname: "/**", // Allow all images from this domain
      },
      {
        protocol: "https",
        hostname: "media.licdn.com",
        pathname: "/**", // Allow all images from this domain
      },
    ],
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;

    return config;
  },
};

export default nextConfig;
