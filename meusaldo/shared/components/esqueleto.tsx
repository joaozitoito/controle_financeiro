/** Blocos cinza pulsando no formato do conteúdo; o texto fica só para leitores de tela. */
export function Esqueleto({ rotulo, blocos = ["h-24", "h-24", "h-48"] }: { rotulo: string; blocos?: string[] }) {
  return (
    <div role="status" className="space-y-4">
      <span className="sr-only">{rotulo}</span>
      {blocos.map((altura, indice) => <div key={indice} aria-hidden="true" className={`${altura} animate-brilho rounded-3xl bg-slate-200/70`} style={{ animationDelay: `${indice * 120}ms` }} />)}
    </div>
  );
}
