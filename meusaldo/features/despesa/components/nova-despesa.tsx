"use client";

import { FormularioLancamento } from "@/shared/components/formulario-lancamento";
import { despesasApi } from "../api/despesas";

/** Formulário de nova despesa para abrir em uma folha fora da página de despesas. */
export function NovaDespesa() {
  return <FormularioLancamento tipo="despesa" salvar={dados => despesasApi.salvar(dados)} />;
}
