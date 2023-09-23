/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // this api mostly uses `cdn2.thecatapi.com` but it also has a few images on random hosts
    remotePatterns: [{ hostname: "*" }],
  }
}

module.exports = nextConfig
