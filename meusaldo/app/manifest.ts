import type { MetadataRoute } from "next";

/** Permite instalar pela opção "Adicionar à tela de início" e abrir sem a barra do navegador. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MeuSaldo",
    short_name: "MeuSaldo",
    description: "Controle financeiro pessoal: receitas, despesas e saldo.",
    start_url: "/saldo",
    display: "standalone",
    background_color: "#f6f8fb",
    theme_color: "#f6f8fb",
    lang: "pt-BR",
    icons: [
      { src: "/icone-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icone-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icone-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
