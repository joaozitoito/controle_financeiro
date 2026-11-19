import type { Metadata } from "next";
import { PaginaSaldo } from "@/features/saldo/components/pagina-saldo";
import { Saudacao } from "@/features/sessao/components/cabecalho-sessao";
import { NovaReceita } from "@/features/receita/components/nova-receita";
import { NovaDespesa } from "@/features/despesa/components/nova-despesa";

export const metadata: Metadata = { title: "Resumo financeiro" };

export default function SaldoPage() {
  return <PaginaSaldo saudacao={<Saudacao />} novaReceita={<NovaReceita />} novaDespesa={<NovaDespesa />} />;
}
