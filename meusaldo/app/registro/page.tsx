import type { Metadata } from "next";
import { Suspense } from "react";
import { FormularioSessao } from "@/features/sessao/components/formulario-sessao";

export const metadata: Metadata = { title: "Criar conta" };
export default function RegistroPage() {
  return <Suspense fallback={<p role="status">Carregando cadastro…</p>}><FormularioSessao modo="registro" /></Suspense>;
}
