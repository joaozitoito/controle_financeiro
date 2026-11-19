"use client";

import { useRef, useState, type FormEvent } from "react";
import { ErroHttp } from "@/shared/lib/http";
import { CATEGORIAS, categoriaVisual } from "@/shared/lib/categorias";
import { validarFormulario, type DadosLancamento, type FormularioLancamento as Campos } from "@/shared/lib/financeiro";
import { hojeLocal } from "@/shared/lib/periodo";
import { avisar } from "./avisos";
import { useFecharFolha } from "./folha";
import { Icone } from "./icone";

export type TipoFormulario = "receita" | "despesa" | "conta";

const BOTAO: Record<TipoFormulario, string> = {
  receita: "border-emerald-600 bg-emerald-600 hover:bg-emerald-700",
  despesa: "border-red-600 bg-red-600 hover:bg-red-700",
  conta: "",
};

/** Formulário de receita, despesa ou conta (o campo "data" é o vencimento da conta). */
export function FormularioLancamento({ tipo, inicial, salvar, onSalvo }: {
  tipo: TipoFormulario;
  inicial?: Campos;
  salvar: (dados: DadosLancamento) => Promise<unknown>;
  onSalvo?: () => void;
}) {
  const editando = Boolean(inicial);
  const [formulario, setFormulario] = useState<Campos>(inicial ?? { descricao: "", valor: "", categoria: "", data: tipo === "conta" ? "" : hojeLocal() });
  const [campos, setCampos] = useState<Record<string, string>>({});
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const ocupado = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const fecharFolha = useFecharFolha();
  const id = `${tipo}-${editando ? "editar" : "novo"}`;

  function focar(nome: string) {
    const elemento = formRef.current?.elements.namedItem(nome);
    // Categoria é um grupo de rádios: foca a opção marcada ou a primeira.
    const alvo = elemento instanceof RadioNodeList ? [...elemento].find(opcao => (opcao as HTMLInputElement).checked) ?? elemento[0] : elemento;
    if (alvo instanceof HTMLElement) alvo.focus();
  }

  function mudar(nome: keyof Campos, valor: string) {
    setFormulario(anterior => ({ ...anterior, [nome]: valor }));
    setCampos(anterior => ({ ...anterior, [nome]: "" }));
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (ocupado.current) return;
    const validacao = validarFormulario(formulario);
    setCampos(validacao.campos);
    setErro("");
    if (!validacao.dados) {
      focar(Object.keys(validacao.campos)[0]);
      return;
    }
    ocupado.current = true;
    setEnviando(true);
    try {
      await salvar(validacao.dados);
      avisar(`${tipo[0].toUpperCase()}${tipo.slice(1)} ${editando ? "atualizada" : "registrada"}.`);
      onSalvo?.();
      fecharFolha?.();
    } catch (falha) {
      setErro(falha instanceof ErroHttp ? falha.message : "Não foi possível salvar.");
      if (falha instanceof ErroHttp) {
        // A API de contas chama a data de "vencimento".
        const { vencimento, ...resto } = falha.campos;
        const erros = vencimento ? { ...resto, data: vencimento } : resto;
        setCampos(erros);
        focar(Object.keys(erros)[0] ?? "descricao");
      }
    } finally {
      ocupado.current = false;
      setEnviando(false);
    }
  }

  const erroDe = (nome: string) => campos[nome] && <p id={`${id}-${nome}-erro`} role="alert" className="text-sm text-red-700">{campos[nome]}</p>;
  const descrito = (nome: string, extra = "") => [extra, campos[nome] ? `${id}-${nome}-erro` : ""].filter(Boolean).join(" ") || undefined;
  const opcoes = [...CATEGORIAS.map(categoria => categoria.nome), ...(formulario.categoria && !CATEGORIAS.some(categoria => categoria.nome === formulario.categoria) ? [formulario.categoria] : [])];

  return (
    <form ref={formRef} onSubmit={enviar} noValidate autoComplete="off" aria-busy={enviando}>
      <fieldset disabled={enviando} className="min-w-0 space-y-5">
        <legend className="sr-only">Dados da {tipo}</legend>
        {erro && <p role="alert" className="animate-surgir rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-900">{erro} O que você digitou foi mantido.</p>}

        <div className="space-y-1.5">
          <label htmlFor={`${id}-valor`} className="block text-sm font-medium text-slate-600">Valor</label>
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-2xl font-semibold text-slate-400" aria-hidden="true">R$</span>
            <input id={`${id}-valor`} name="valor" required data-autofoco inputMode="decimal" placeholder="0,00" value={formulario.valor}
              className="campo min-h-16 pl-14 text-3xl font-bold tracking-tight tabular-nums"
              aria-invalid={Boolean(campos.valor)} aria-describedby={descrito("valor", `${id}-ajuda-valor`)}
              onChange={evento => mudar("valor", evento.target.value)} />
          </div>
          <p id={`${id}-ajuda-valor`} className="sr-only">Até duas casas decimais, sem ponto de milhar. Ex.: 1250,90.</p>
          {erroDe("valor")}
        </div>

        <div className="space-y-1.5">
          <label htmlFor={`${id}-descricao`} className="block text-sm font-medium text-slate-600">Descrição</label>
          <input id={`${id}-descricao`} name="descricao" required maxLength={100} value={formulario.descricao} className="campo"
            placeholder={tipo === "receita" ? "Ex.: Salário" : tipo === "despesa" ? "Ex.: Mercado da semana" : "Ex.: Conta de luz"}
            aria-invalid={Boolean(campos.descricao)} aria-describedby={descrito("descricao")}
            onChange={evento => mudar("descricao", evento.target.value)} />
          {erroDe("descricao")}
        </div>

        <div className="space-y-2">
          <p id={`${id}-categoria-rotulo`} className="text-sm font-medium text-slate-600">Categoria</p>
          <div role="radiogroup" aria-required="true" aria-labelledby={`${id}-categoria-rotulo`} aria-invalid={Boolean(campos.categoria)} aria-describedby={descrito("categoria")}
            className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
            {opcoes.map(opcao => {
              const marcada = formulario.categoria === opcao;
              return <label key={opcao} className="shrink-0 cursor-pointer">
                <input type="radio" name="categoria" value={opcao} checked={marcada} className="peer sr-only" onChange={() => mudar("categoria", opcao)} />
                <span className={`flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium whitespace-nowrap transition duration-200 active:scale-95 peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-blue-600 ${marcada ? "scale-[1.03] border-slate-900 bg-slate-900 text-white shadow-md shadow-slate-900/20" : `border-slate-200 bg-white text-slate-700 hover:border-slate-300 ${campos.categoria ? "border-red-300" : ""}`}`}>
                  <Icone nome={categoriaVisual(opcao).icone} className="size-4 opacity-80" />{opcao}
                </span>
              </label>;
            })}
          </div>
          {erroDe("categoria")}
        </div>

        <div className="space-y-1.5">
          <label htmlFor={`${id}-data`} className="block text-sm font-medium text-slate-600">{tipo === "conta" ? "Vencimento" : "Data"}</label>
          <input id={`${id}-data`} name="data" type="date" required min="0001-01-01" max="9999-12-31" value={formulario.data} className="campo"
            aria-invalid={Boolean(campos.data)} aria-describedby={descrito("data")}
            onChange={evento => mudar("data", evento.target.value)} />
          {erroDe("data")}
        </div>

        <button type="submit" className={`botao-primario min-h-13 w-full text-base ${BOTAO[tipo]}`}>
          {enviando ? "Salvando…" : editando ? "Salvar alterações" : `Registrar ${tipo}`}
        </button>
      </fieldset>
    </form>
  );
}
