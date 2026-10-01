/** @type {import('next').NextConfig} */
const nextConfig: import('next').NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  // typescript.ignoreBuildErrors is deliberately NOT set, so `next build`
  // type-checks for real. It used to be commented out here while `tsc --noEmit`
  // reported 159 errors, which meant a genuine type error could not fail a build.
  // That is now fixed - tsc is clean and the build passes with the check active.
  // typescript: {
  //   ignoreBuildErrors: true,
  // },
  images: {
    unoptimized: true,
  },
  output: 'standalone',
};

export default nextConfig;
