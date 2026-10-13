import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import {
  UPLOADED_IMAGE_HOSTNAME,
  UPLOADED_IMAGE_PATH,
} from './lib/uploadedImageLocation';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: UPLOADED_IMAGE_HOSTNAME,
        pathname: `${UPLOADED_IMAGE_PATH}**`,
      },
    ],
  },
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
