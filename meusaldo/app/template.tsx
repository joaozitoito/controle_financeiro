import type { ReactNode } from "react";

/** Recriado a cada navegação: cada tela entra com um fade curto. Só opacidade, para não afetar elementos fixos. */
export default function Template({ children }: { children: ReactNode }) {
  return <div className="animate-aparecer">{children}</div>;
}
