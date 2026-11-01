import type { ReactNode } from 'react';
import type { PalabraDeJuego } from '@/data/juegos';

export const BOTON_JUEGO =
  'tocable inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-rojo-campo px-5 py-3 text-lg font-bold text-rojo-texto hover:bg-rojo-tinte [--tocable-sombra:var(--color-rojo)]';

type Tipo = 'acierto' | 'error' | 'pista';

export function Marca({ tipo, animar = false }: { tipo: Tipo; animar?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${animar ? 'juego-acierto' : ''}`}
    >
      {tipo === 'acierto' ? (
        <path d="m5 12 4 4L19 6" />
      ) : tipo === 'error' ? (
        <path d="m7 7 10 10M17 7 7 17" />
      ) : (
        <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7h.01" /></>
      )}
    </svg>
  );
}

export function MensajeJuego({
  tipo,
  titulo,
  children,
}: {
  tipo: Tipo;
  titulo: string;
  children?: ReactNode;
}) {
  const estilo = tipo === 'acierto'
    ? 'bg-verde-tinte text-verde-texto'
    : tipo === 'error'
      ? 'bg-rojo-tinte text-rojo-texto'
      : 'bg-amarillo-tinte text-amarillo-tinte-texto';

  return (
    <div className={`flex items-start gap-3 rounded-2xl p-4 ${estilo}`}>
      <Marca tipo={tipo} animar={tipo === 'acierto'} />
      <div className="min-w-0">
        <p className="font-bold">{titulo}</p>
        {children && <div className="mt-2">{children}</div>}
      </div>
    </div>
  );
}

/** Fila de vocabulario: se lee, así que no lleva relieve de botón. */
export function FichaPalabra({ palabra }: { palabra: PalabraDeJuego }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <dt lang="mam" className="mam text-xl font-bold">{palabra.mam}</dt>
      <dd className="flex flex-wrap items-baseline gap-x-2">
        <span className="text-lg">{palabra.espanol}</span>
        {palabra.clase && <span className="text-base italic">{palabra.clase}</span>}
      </dd>
    </div>
  );
}
