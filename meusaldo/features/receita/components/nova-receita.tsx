"use client";

import { FormularioLancamento } from "@/shared/components/formulario-lancamento";
import { receitasApi } from "../api/receitas";

/** Formulário de nova receita para abrir em uma folha fora da página de receitas. */
export function NovaReceita() {
  return <FormularioLancamento tipo="receita" salvar={dados => receitasApi.salvar(dados)} />;
}
