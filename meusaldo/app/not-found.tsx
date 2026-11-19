import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md animate-surgir pt-10 text-center">
      <p className="text-6xl font-extrabold tracking-tight text-blue-600">404</p>
      <h1 className="mt-3 text-2xl font-bold tracking-tight">Página não encontrada</h1>
      <p className="mt-2 text-slate-500">O endereço solicitado não existe. Use o menu ou volte ao resumo.</p>
      <Link href="/saldo" className="botao-primario mt-6 min-h-12 px-6 text-base">Voltar ao resumo</Link>
    </div>
  );
}
