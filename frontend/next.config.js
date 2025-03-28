/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Environment variable to control API URL
  // Will use environment variable in production or fallback to localhost for development
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },

  // Configure image domains if needed
  images: {
    domains: ['localhost'],
  },

  // Output as standalone for easier deployment
  output: 'standalone',
};

module.exports = nextConfig; 