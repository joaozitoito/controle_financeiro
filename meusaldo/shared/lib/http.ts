export const EVENTO_SESSAO_INVALIDA = "meusaldo:sessao-invalida";
let cicloSessao = 0;

export function novoCicloSessao(): void {
  cicloSessao += 1;
}

export class ErroHttp extends Error {
  readonly status: number;
  readonly campos: Record<string, string>;

  constructor(mensagem: string, status: number, campos: Record<string, string> = {}) {
    super(mensagem);
    this.name = "ErroHttp";
    this.status = status;
    this.campos = campos;
  }
}

function obterUrlApi(): string {
  const valor = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:3001";
  const url = new URL(valor);

  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error("NEXT_PUBLIC_API_URL deve ser uma URL HTTP(S) sem credenciais, query ou fragmento.");
  }

  return url.toString().replace(/\/+$/, "");
}

function ehObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

/** O tipo T descreve o contrato esperado; não faz validação de esquema em runtime. */
export async function requisitar<T>(caminho: `/${string}`, opcoes: RequestInit = {}): Promise<T> {
  const urlBase = obterUrlApi();
  const cicloPedido = cicloSessao;
  const headers = new Headers(opcoes.headers);
  headers.set("Accept", "application/json");
  if (!["GET", "HEAD", "OPTIONS"].includes((opcoes.method ?? "GET").toUpperCase())) headers.set("X-MeuSaldo-Request", "1");

  if (opcoes.body != null && typeof opcoes.body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let resposta: Response;

  try {
    resposta = await fetch(`${urlBase}${caminho}`, { ...opcoes, headers, cache: "no-store", credentials: "include" });
  } catch (erro) {
    if (opcoes.signal?.aborted) throw erro;
    throw new ErroHttp("Não foi possível conectar à API. Tente novamente.", 0);
  }

  if (resposta.status === 401 && caminho !== "/auth/login" && caminho !== "/auth/registro" && !opcoes.signal?.aborted && cicloPedido === cicloSessao && typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVENTO_SESSAO_INVALIDA));
  }

  if (resposta.status === 204) return undefined as T;

  let dados: unknown;
  try {
    dados = await resposta.json();
  } catch {
    throw new ErroHttp("A API retornou uma resposta inválida.", resposta.status);
  }

  if (!resposta.ok) {
    const mensagem = ehObjeto(dados) && typeof dados.erro === "string"
      ? dados.erro
      : "Não foi possível concluir a solicitação.";
    const campos = ehObjeto(dados) && ehObjeto(dados.campos)
      ? Object.fromEntries(Object.entries(dados.campos).filter((entrada): entrada is [string, string] => typeof entrada[1] === "string"))
      : {};

    throw new ErroHttp(mensagem, resposta.status, campos);
  }

  return dados as T;
}
