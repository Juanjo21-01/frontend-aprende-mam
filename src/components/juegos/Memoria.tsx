/**
 * Memoria: encontrar las parejas de cada palabra en Mam con su significado.
 *
 * Toda la mecánica está en `src/data/juegos.ts` y probada en Node; aquí solo se pinta.
 *
 * Decisiones pensadas para primaria en un teléfono de gama baja:
 *  - **Sin temporizador.** Dos cartas que no coinciden se quedan a la vista hasta el siguiente
 *    toque, que las da vuelta y voltea la nueva a la vez. Quien lee despacio alcanza a leer.
 *  - **Sin cronómetro ni sonidos.** Se cuentan los intentos, nada más.
 *  - Cada carta es un `<button>`: se juega también con teclado, y el lector de pantalla dice
 *    qué hay en cada una.
 */
import { useEffect, useState } from 'react';

import {
  hayFallo,
  memoriaTerminada,
  nuevaPartidaMemoria,
  voltear,
  type Carta,
  type PalabraDeJuego,
  type PartidaMemoria,
} from '@/data/juegos';
import ListaDePalabras from './ListaDePalabras';

interface Props {
  palabras: PalabraDeJuego[];
}

export default function Memoria({ palabras }: Props) {
  // `null` en el HTML compilado: el reparto al azar solo puede hacerse en el navegador.
  const [partida, setPartida] = useState<PartidaMemoria | null>(null);

  useEffect(() => setPartida(nuevaPartidaMemoria(palabras)), [palabras]);

  if (partida === null) return <ListaDePalabras palabras={palabras} />;

  const total = partida.palabras.length;
  const terminada = memoriaTerminada(partida);
  const fallo = hayFallo(partida);
  const ultima = partida.encontradas.at(-1);

  return (
    <section>
      <p className="text-tinta-suave">
        Toca dos cartas. Si son la misma palabra en <span lang="mam">Mam</span>{' '}
        y en castellano, forman pareja y se quedan a la vista.
      </p>

      <p className="mt-3 flex flex-wrap gap-x-6 font-bold" aria-live="polite">
        <span>
          Parejas: {partida.encontradas.length} de {total}
        </span>
        <span>Intentos: {partida.intentos}</span>
      </p>

      <ul className="mt-4 grid grid-cols-4 gap-2 sm:gap-3">
        {partida.cartas.map((carta, indice) => {
          const emparejada = partida.encontradas.includes(carta.par);
          const visible = emparejada || partida.arriba.includes(indice);

          return (
            <li key={indice}>
              <CartaMemoria
                carta={carta}
                numero={indice + 1}
                visible={visible}
                emparejada={emparejada}
                fallida={fallo && partida.arriba.includes(indice)}
                alTocar={() => setPartida(voltear(partida, indice))}
              />
            </li>
          );
        })}
      </ul>

      <div aria-live="polite">
        {fallo && !terminada && (
          <p className="mt-4 text-tinta-suave">
            No son pareja. Toca otra carta para seguir.
          </p>
        )}

        {ultima !== undefined && !fallo && !terminada && (
          <Pareja palabra={partida.palabras[ultima]!} titulo="¡Pareja!" />
        )}
      </div>

      {terminada && (
        <div className="mt-6 rounded-xl border border-oro-borde bg-oro-tinte p-5">
          <p className="text-xl font-bold text-jade-hondo">
            ¡Encontraste las {total} parejas en {partida.intentos} intentos!
          </p>

          <dl className="mt-4 flex flex-col gap-2">
            {partida.encontradas.map((par) => (
              <Fila key={par} palabra={partida.palabras[par]!} />
            ))}
          </dl>

          <button
            type="button"
            onClick={() => setPartida(nuevaPartidaMemoria(palabras))}
            className="mt-5 min-h-11 rounded-xl bg-jade-hondo px-5 py-2 font-bold text-papel hover:bg-jade"
          >
            Jugar otra vez
          </button>
        </div>
      )}
    </section>
  );
}

interface PropsCarta {
  carta: Carta;
  numero: number;
  visible: boolean;
  emparejada: boolean;
  fallida: boolean;
  alTocar: () => void;
}

function CartaMemoria({
  carta,
  numero,
  visible,
  emparejada,
  fallida,
  alTocar,
}: PropsCarta) {
  const enMam = carta.cara === 'mam';

  if (!visible) {
    return (
      <button
        type="button"
        onClick={alTocar}
        aria-label={`Carta ${numero}, boca abajo`}
        className="flex min-h-22 w-full items-center justify-center rounded-xl border-2 border-jade-hondo bg-jade-hondo text-oro hover:bg-jade"
      >
        {/* El rombo de la cenefa del huipil, el mismo motivo del encabezado. */}
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path
            d="M12 3 21 12 12 21 3 12Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path d="M12 9 15 12 12 15 9 12Z" fill="currentColor" />
        </svg>
      </button>
    );
  }

  const estilo = emparejada
    ? 'border-oro-borde bg-oro-tinte'
    : fallida
      ? 'border-alerta bg-papel'
      : 'border-jade bg-papel';

  return (
    <button
      type="button"
      onClick={alTocar}
      aria-disabled={emparejada}
      aria-label={`Carta ${numero}${emparejada ? ', pareja encontrada' : ''}: ${carta.texto}`}
      className={`flex min-h-22 w-full items-center justify-center rounded-xl border-2 p-1.5 text-center break-words hyphens-auto ${estilo}`}
    >
      {enMam ? (
        <span
          lang="mam"
          className="mam text-lg leading-tight font-bold text-jade-hondo"
        >
          {carta.texto}
        </span>
      ) : (
        <span className="text-sm leading-tight sm:text-base">
          {carta.texto}
        </span>
      )}
    </button>
  );
}

function Pareja({
  palabra,
  titulo,
}: {
  palabra: PalabraDeJuego;
  titulo: string;
}) {
  return (
    <div className="mt-4 rounded-xl border border-borde p-4">
      <p className="text-sm font-bold text-tinta-suave">{titulo}</p>
      <dl className="mt-1">
        <Fila palabra={palabra} />
      </dl>
    </div>
  );
}

function Fila({ palabra }: { palabra: PalabraDeJuego }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2">
      <dt lang="mam" className="mam text-xl font-bold text-jade-hondo">
        {palabra.mam}
      </dt>
      <dd className="flex flex-wrap items-baseline gap-x-2">
        <span className="text-lg">{palabra.espanol}</span>
        {palabra.clase && (
          <span className="text-sm text-tinta-suave italic">
            {palabra.clase}
          </span>
        )}
      </dd>
    </div>
  );
}
