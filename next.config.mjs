/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ['sharp'],
  experimental: {
    serverActions: {
      bodySizeLimit: '120mb',
      // Behind CloudFront the server sees its own host (honestbox.onrender.com, later the AWS origin),
      // while browsers send Origin: https://honest-box.com. Trust our public addresses for form posts.
      allowedOrigins: ['honest-box.com', 'www.honest-box.com', 'api.honest-box.com', 'staging.honest-box.com'],
    },
  },
};
export default nextConfig;
