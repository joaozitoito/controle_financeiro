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
        <h1 className="text-3xl font-extrabold tracking-tight">{titulo}</h1>
        <p className="max-w-2xl text-sm leading-6 text-slate-500">{descricao}</p>
      </div>
      {children}
    </div>
  );
}
