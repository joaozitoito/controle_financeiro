import type { Metadata, Viewport } from "next";
import { SessaoProvider } from "@/features/sessao/components/sessao-provider";
import { ProtecaoSessao } from "@/features/sessao/components/protecao-sessao";
import { CabecalhoSessao } from "@/features/sessao/components/cabecalho-sessao";
import { Avisos } from "@/shared/components/avisos";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "MeuSaldo", template: "%s | MeuSaldo" },
  description: "Controle financeiro pessoal: receitas, despesas e saldo.",
  appleWebApp: { capable: true, title: "MeuSaldo", statusBarStyle: "default" },
};

export const viewport: Viewport = { themeColor: "#f6f8fb", viewportFit: "cover" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR">
      <body className="min-h-dvh bg-[#f6f8fb] font-sans text-slate-900 antialiased">
        <a href="#conteudo" className="skip-link">Pular para o conteúdo</a>
        <SessaoProvider>
          {/* Lado a lado só quando o cabeçalho é a barra lateral (sessão autenticada). */}
          <div className="lg:has-[>[data-lateral]]:flex">
            <CabecalhoSessao />
            <main id="conteudo" tabIndex={-1} className="mx-auto w-full max-w-7xl min-w-0 px-4 py-6 sm:px-6 sm:py-8 lg:flex-1 lg:px-8 [[data-lateral]~&]:pb-[calc(7rem+env(safe-area-inset-bottom))] lg:[[data-lateral]~&]:pb-8">
              <ProtecaoSessao>{children}</ProtecaoSessao>
            </main>
          </div>
          <Avisos />
        </SessaoProvider>
      </body>
    </html>
  );
}
