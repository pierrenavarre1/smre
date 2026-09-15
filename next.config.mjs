/** @type {import('next').NextConfig} */
const nextConfig={images:{remotePatterns:[{protocol:'https',hostname:'images.unsplash.com'},{protocol:'https',hostname:'s3.amazonaws.com'},{protocol:'https',hostname:'images.homes.com'},{protocol:'https',hostname:'imagecdn.realty.com'}]}}; export default nextConfig;
