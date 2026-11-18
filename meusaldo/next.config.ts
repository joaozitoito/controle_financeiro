import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Gera .next/standalone para a imagem Docker de produção.
  output: "standalone",
};

export default nextConfig;
