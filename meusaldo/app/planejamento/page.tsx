import type { Metadata } from "next";
import { PaginaPlanejamento } from "@/features/orcamento/components/pagina-planejamento";

export const metadata: Metadata = { title: "Planejamento" };

export default function PlanejamentoPage() {
  return <PaginaPlanejamento />;
}
