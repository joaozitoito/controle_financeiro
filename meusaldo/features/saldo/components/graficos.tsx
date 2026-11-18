import { useId } from "react";

export function GraficoLinha({ valores, cor, className, rotulo }: { valores: number[]; cor: string; className?: string; rotulo?: string }) {
  const id = `grad${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const minimo = Math.min(...valores);
  const faixa = Math.max(...valores) - minimo || 1;
  const linha = valores.map((valor, indice) => {
    const x = valores.length === 1 ? 50 : (indice / (valores.length - 1)) * 100;
    const y = 36 - ((valor - minimo) / faixa) * 32;
    return `${indice ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ");

  return (
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className={className} role={rotulo ? "img" : undefined} aria-label={rotulo} aria-hidden={rotulo ? undefined : true}>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={cor} stopOpacity="0.2" />
          <stop offset="1" stopColor={cor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${linha} L100,40 L0,40 Z`} fill={`url(#${id})`} />
      <path d={linha} fill="none" stroke={cor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** Círculo de circunferência 100 (r = 100 / 2π): cada fatia usa a porcentagem direto no dasharray. */
export function GraficoRosca({ fatias, className }: { fatias: { valor: number; cor: string }[]; className?: string }) {
  const total = fatias.reduce((soma, fatia) => soma + fatia.valor, 0);
  let acumulado = 0;
  return (
    <svg viewBox="0 0 42 42" className={className} aria-hidden="true">
      <circle cx="21" cy="21" r="15.9155" fill="none" stroke="#e2e8f0" strokeWidth="6" />
      {total > 0 && fatias.map((fatia, indice) => {
        const parte = (fatia.valor / total) * 100;
        const deslocamento = 25 - acumulado;
        acumulado += parte;
        return <circle key={indice} cx="21" cy="21" r="15.9155" fill="none" stroke={fatia.cor} strokeWidth="6" strokeDasharray={`${parte} ${100 - parte}`} strokeDashoffset={deslocamento} />;
      })}
    </svg>
  );
}
