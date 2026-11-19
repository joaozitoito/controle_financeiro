import { useId } from "react";

export function GraficoLinha({ valores, cor, className, rotulo, suave = false }: { valores: number[]; cor: string; className?: string; rotulo?: string; suave?: boolean }) {
  const id = `grad${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const minimo = Math.min(...valores);
  const faixa = Math.max(...valores) - minimo || 1;
  const pontos = valores.map((valor, indice) => [
    valores.length === 1 ? 50 : (indice / (valores.length - 1)) * 100,
    36 - ((valor - minimo) / faixa) * 32,
  ]);
  // Suave: curva cúbica com tangente horizontal em cada ponto (não ultrapassa os valores reais).
  const linha = pontos.map(([x, y], indice) => {
    if (!indice) return `M${x.toFixed(2)},${y.toFixed(2)}`;
    if (!suave) return `L${x.toFixed(2)},${y.toFixed(2)}`;
    const [x0, y0] = pontos[indice - 1], meio = ((x0 + x) / 2).toFixed(2);
    return `C${meio},${y0.toFixed(2)} ${meio},${y.toFixed(2)} ${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ");

  return (
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className={className} role={rotulo ? "img" : undefined} aria-label={rotulo} aria-hidden={rotulo ? undefined : true}>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={cor} stopOpacity="0.2" />
          <stop offset="1" stopColor={cor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path key={`a${linha}`} d={`${linha} L100,40 L0,40 Z`} fill={`url(#${id})`} className="animate-aparecer [animation-delay:400ms] [animation-duration:800ms]" />
      <path key={linha} d={linha} pathLength={1} strokeDasharray={1} className="animate-desenhar" fill="none" stroke={cor} strokeWidth={suave ? 3 : 2} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
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
