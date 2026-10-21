import type { ReactNode } from "react";

type PaginaFeatureProps = {
  titulo: string;
  descricao: string;
  children: ReactNode;
};

export function PaginaFeature({ titulo, descricao, children }: PaginaFeatureProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{titulo}</h1>
        <p className="max-w-2xl text-sm leading-6 text-slate-600">{descricao}</p>
      </div>
      {children}
    </div>
  );
}
