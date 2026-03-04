/** @type {import('next').NextConfig} */
const nextConfig = {
   images: {
    domains: ['res.cloudinary.com'],
  },
  // Increase API body size limit for file uploads
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
  reactCompiler: true,
   env: {
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
  },
};

export default nextConfig;
