import type { Metadata } from "next";
import { PaginaReceitas } from "@/features/receita/components/pagina-receitas";

export const metadata: Metadata = { title: "Receitas" };

export default function ReceitasPage() {
  return <PaginaReceitas />;
}
