"use client";

import { PaginaFeature } from "@/shared/components/pagina-feature";
import { GerenciadorLancamentos } from "@/shared/components/gerenciador-lancamentos";
import { despesasApi } from "../api/despesas";

export function PaginaDespesas() {
  return (
    <PaginaFeature titulo="Despesas" descricao="Registre as saídas e acompanhe como elas afetam seu saldo.">
      <GerenciadorLancamentos tipo="despesa" api={despesasApi} />
    </PaginaFeature>
  );
}
