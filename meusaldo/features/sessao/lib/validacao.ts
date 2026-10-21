export type FormularioSessao = { nome: string; email: string; senha: string; confirmacao: string };

export function validarFormularioSessao(modo: "login" | "registro", formulario: FormularioSessao): Record<string, string> {
  const campos: Record<string, string> = {};
  const email = formulario.email.trim();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) campos.email = "Informe um e-mail válido.";
  if (!formulario.senha || Array.from(formulario.senha).length > 128) campos.senha = "Informe sua senha (até 128 caracteres).";
  if (modo === "registro") {
    if (formulario.nome.trim().length < 2 || formulario.nome.trim().length > 100) campos.nome = "Use de 2 a 100 caracteres no nome.";
    if (!formulario.senha.trim() || Array.from(formulario.senha).length < 12) campos.senha = "Use uma senha de 12 a 128 caracteres.";
    if (formulario.confirmacao !== formulario.senha) campos.confirmacao = "As senhas precisam ser iguais.";
  }
  return campos;
}

export function destinoSeguro(destino: string | null): string {
  if (!destino) return "/saldo";
  const rota = destino.split(/[?#]/)[0];
  return ["/saldo", "/receitas", "/despesas"].includes(rota) ? destino : "/saldo";
}
