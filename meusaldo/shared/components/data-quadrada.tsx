import type { Tom } from "@/shared/lib/contas";

const DIAS_SEMANA = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
const TONS: Record<Tom, string> = { vermelho: "bg-red-50 text-red-700", laranja: "bg-orange-50 text-orange-700", neutro: "bg-slate-100 text-slate-700", paga: "bg-emerald-50 text-emerald-700" };

/** Quadradinho com dia do mês e dia da semana de uma data YYYY-MM-DD. */
export function DataQuadrada({ data, tom }: { data: string; tom: Tom }) {
  return (
    <time dateTime={data.slice(0, 10)} className={`grid size-12 shrink-0 place-content-center rounded-xl text-center leading-none ${TONS[tom]}`}>
      <span className="text-lg font-bold">{data.slice(8, 10)}</span>
      <span className="mt-0.5 text-[10px] font-semibold">{DIAS_SEMANA[new Date(`${data.slice(0, 10)}T00:00:00.000Z`).getUTCDay()]}</span>
    </time>
  );
}

export const COR_TOM: Record<Tom, string> = { vermelho: "text-red-700", laranja: "text-orange-700", neutro: "text-slate-500", paga: "text-emerald-700" };
