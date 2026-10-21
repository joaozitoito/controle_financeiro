import type { Metadata } from "next";
import { SessaoProvider } from "@/features/sessao/components/sessao-provider";
import { ProtecaoSessao } from "@/features/sessao/components/protecao-sessao";
import { CabecalhoSessao } from "@/features/sessao/components/cabecalho-sessao";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "MeuSaldo", template: "%s | MeuSaldo" },
  description: "Controle financeiro pessoal: receitas, despesas e saldo.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR">
      <body className="min-h-dvh bg-slate-50 font-sans text-slate-900 antialiased">
        <a href="#conteudo" className="skip-link">Pular para o conteúdo</a>
        <SessaoProvider>
          <CabecalhoSessao />
          <main id="conteudo" tabIndex={-1} className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
            <ProtecaoSessao>{children}</ProtecaoSessao>
          </main>
        </SessaoProvider>
      </body>
    </html>
  );
}
