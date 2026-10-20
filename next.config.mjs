/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  serverExternalPackages: [],
  experimental: { serverActions: { bodySizeLimit: '1mb' } },
};
export default nextConfig;
