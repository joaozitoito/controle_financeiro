import type { Metadata } from "next";
import { PaginaContas } from "@/features/conta/components/pagina-contas";

export const metadata: Metadata = { title: "Contas a pagar" };

export default function ContasPage() {
  return <PaginaContas />;
}
