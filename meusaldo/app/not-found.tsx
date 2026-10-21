import Link from "next/link";

export default function NotFound() {
  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-slate-500">Erro 404</p>
      <h1 className="text-2xl font-semibold">Página não encontrada</h1>
      <p className="text-sm text-slate-600">O endereço solicitado não existe. Use o menu ou volte ao resumo.</p>
      <Link href="/saldo" className="inline-block rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">
        Voltar ao resumo
      </Link>
    </div>
  );
}
