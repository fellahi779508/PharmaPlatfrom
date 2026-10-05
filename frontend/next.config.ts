import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    unoptimized: true,
  },
  trailingSlash: false,
  allowedDevOrigins: ['192.168.1.4'],
};
const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
