import type { Metadata } from "next";
import { PaginaSaldo } from "@/features/saldo/components/pagina-saldo";

export const metadata: Metadata = { title: "Resumo financeiro" };

export default function SaldoPage() {
  return <PaginaSaldo />;
}
