/** @type {import('next').NextConfig} */
const nextConfig = {
  // Safety net for a smooth first deploy. Once your team is set up,
  // you can flip these to false to enforce lint + type checks in CI.
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  // To host on Strato (static files) instead of Vercel, uncomment:
  // output: "export",
};

export default nextConfig;
