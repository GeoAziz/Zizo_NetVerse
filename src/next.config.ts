import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  typescript: {
    tsconfigPath: './tsconfig.json',
    // Strict mode enabled - all TS errors must be resolved
  },
  eslint: {
    dirs: ['src'],
    // ESLint runs on build - warnings must be addressed
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
