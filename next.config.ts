import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Some networks (DNS64/NAT64) resolve supabase.co to IPv4-mapped addresses
    // like 64:ff9b::/96, which Next's SSRF check classifies as private and
    // rejects with a 400, so every image renders blank. The remotePatterns
    // allowlist below still confines the optimizer to the public cv-images
    // bucket, so trusting local IPs is scoped to that one allowlisted host.
    dangerouslyAllowLocalIP: true,
    // The pathname is what scopes this allowlist: it permits only public
    // objects in the cv-images bucket, so a stray URL cannot turn the
    // optimizer into a general-purpose image proxy. The host is a wildcard
    // rather than derived from SUPABASE_URL because design.md §8 scopes the
    // Supabase vars to production only and CI builds with no env vars, so a
    // host read from the environment would break every preview and CI build.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/cv-images/**",
      },
    ],
  },
};

export default nextConfig;