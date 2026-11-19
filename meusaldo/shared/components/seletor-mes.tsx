import { Icone } from "./icone";
import { deslocarMes, nomeMes } from "@/shared/lib/periodo";

export function SeletorMes({ mes, onMudar }: { mes: string; onMudar: (mes: string) => void }) {
  return (
    <div className="flex w-fit items-center rounded-xl border border-slate-200 bg-white shadow-sm">
      <button type="button" className="grid size-11 place-items-center rounded-l-xl text-slate-600 hover:bg-slate-50" aria-label="Mês anterior" onClick={() => onMudar(deslocarMes(mes, -1))}><Icone nome="anterior" /></button>
      <p aria-live="polite" className="min-w-24 text-center text-sm font-medium">{nomeMes(mes, true)} {mes.slice(0, 4)}</p>
      <button type="button" className="grid size-11 place-items-center rounded-r-xl text-slate-600 hover:bg-slate-50" aria-label="Próximo mês" onClick={() => onMudar(deslocarMes(mes, 1))}><Icone nome="proximo" /></button>
    </div>
  );
}
