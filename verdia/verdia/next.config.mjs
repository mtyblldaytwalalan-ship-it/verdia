/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage (product images). Replace with your project host.
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
};
export default nextConfig;
