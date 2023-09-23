/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // https://cdn2.thecatapi.com/
    remotePatterns: [{ hostname: "cdn2.thecatapi.com" }],
  }
}

module.exports = nextConfig
