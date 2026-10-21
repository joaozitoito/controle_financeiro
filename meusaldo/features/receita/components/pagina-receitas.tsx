"use client";

import { PaginaFeature } from "@/shared/components/pagina-feature";
import { GerenciadorLancamentos } from "@/shared/components/gerenciador-lancamentos";
import { receitasApi } from "../api/receitas";

export function PaginaReceitas() {
  return (
    <PaginaFeature titulo="Receitas" descricao="Registre as entradas e mantenha suas receitas organizadas por categoria e data.">
      <GerenciadorLancamentos tipo="receita" api={receitasApi} />
    </PaginaFeature>
  );
}
