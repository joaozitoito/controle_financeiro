import type { Metadata } from "next";
import { PaginaConjunta } from "@/features/conjunta/components/pagina-conjunta";

export const metadata: Metadata = { title: "Conta conjunta" };

export default function ConjuntaPage() {
  return <PaginaConjunta />;
}
