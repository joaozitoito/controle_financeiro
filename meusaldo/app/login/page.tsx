import type { Metadata } from "next";
import { Suspense } from "react";
import { FormularioSessao } from "@/features/sessao/components/formulario-sessao";

export const metadata: Metadata = { title: "Entrar" };
export default function LoginPage() {
  return <Suspense fallback={<p role="status">Carregando acesso…</p>}><FormularioSessao modo="login" /></Suspense>;
}
