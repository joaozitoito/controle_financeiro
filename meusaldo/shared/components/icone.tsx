const caminhos = {
  painel: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  alta: "M3 17l6-6 4 4 8-8M15 7h6v6",
  baixa: "M3 7l6 6 4-4 8 8M15 17h6v-6",
  carteira: "M3 7a2 2 0 0 1 2-2h13v4M3 7v10a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2zM16 14h.01",
  alvo: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
  anterior: "M15 18l-6-6 6-6",
  proximo: "M9 18l6-6-6-6",
  mais: "M12 5v14M5 12h14",
  menos: "M5 12h14",
  ok: "M5 12l5 5L20 7",
  fechar: "M18 6L6 18M6 6l12 12",
  sino: "M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0",
  lapis: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z",
  lixeira: "M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v5M14 11v5",
  calendario: "M3 5h18v16H3zM3 10h18M8 3v4M16 3v4",
  alerta: "M12 3l10 18H2zM12 10v4M12 17h.01",
  sair: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  entrada: "M17 7L7 17M7 7v10h10",
  saida: "M7 17L17 7M7 7h10v10",
  maleta: "M3 7h18v13H3zM8 7V4h8v3",
  casa: "M3 11l9-8 9 8M5 10v10h14V10",
  carrinho: "M3 4h2l2.4 11h11.2L21 8H7M9 20h.01M18 20h.01",
  carro: "M3 16v-4l2-5h14l2 5v4zM7 16v3M17 16v3M3 12h18",
  coracao: "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z",
  livro: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5zM20 17v4H6.5",
  play: "M6 4l14 8-14 8z",
  cartao: "M2 5h20v14H2zM2 10h20",
  etiqueta: "M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8zM7 7h.01",
};

export type NomeIcone = keyof typeof caminhos;

export function Icone({ nome, className = "size-4" }: { nome: NomeIcone; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d={caminhos[nome]} />
    </svg>
  );
}
