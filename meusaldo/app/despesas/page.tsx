import type { Metadata } from "next";
import { PaginaDespesas } from "@/features/despesa/components/pagina-despesas";

export const metadata: Metadata = { title: "Despesas" };

export default function DespesasPage() {
  return <PaginaDespesas />;
}
