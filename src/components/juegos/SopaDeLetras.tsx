/**
 * Sopa de letras: encontrar en la cuadrícula la palabra en Mam de cada pista en castellano.
 *
 * Toda la mecánica está en `src/data/juegos.ts` y probada en Node; aquí solo se pinta.
 *
 * Decisiones pensadas para primaria en un teléfono de gama baja:
 *  - **Una letra Mam por casilla.** `tx’` ocupa una sola, como en el alfabeto que aprenden.
 *  - **Dos toques, no arrastrar.** Arrastrar en una pantalla táctil pelea con el desplazamiento
 *    de la página; tocar la primera letra y luego la última funciona igual en cualquier teléfono
 *    y con teclado.
 *  - **Solo de izquierda a derecha y de arriba abajo.** Sin diagonales ni palabras al revés.
 *  - La pista dice el significado; la palabra en Mam aparece al encontrarla, escrita bien.
 */
import { useEffect, useState } from 'react';

import {
  nuevaPartidaSopa,
  sopaTerminada,
  tocarCasilla,
  type PalabraDeJuego,
  type PartidaSopa,
} from '@/data/juegos';
import ListaDePalabras from './ListaDePalabras';

interface Props {
  palabras: PalabraDeJuego[];
}

export default function SopaDeLetras({ palabras }: Props) {
  // `null` en el HTML compilado: el reparto al azar solo puede hacerse en el navegador.
  const [partida, setPartida] = useState<PartidaSopa | null>(null);

  useEffect(() => setPartida(nuevaPartidaSopa(palabras)), [palabras]);

  if (partida === null) return <ListaDePalabras palabras={palabras} />;

  const total = partida.palabras.length;
  const terminada = sopaTerminada(partida);
  const ultima = partida.encontradas.at(-1);

  return (
    <section>
      <p className="text-tinta-suave">
        Las palabras van de izquierda a derecha o de arriba abajo. Toca la primera letra y después
        la última.
      </p>

      <p className="mt-3 flex flex-wrap gap-x-6 font-bold" aria-live="polite">
        <span>
          Palabras: {partida.encontradas.length} de {total}
        </span>
        <span>Intentos: {partida.intentos}</span>
      </p>

      <div
        className="mt-4 grid max-w-md gap-1"
        style={{ gridTemplateColumns: `repeat(${partida.lado}, minmax(0, 1fr))` }}
      >
        {partida.casillas.map((letra, indice) => {
          const fila = Math.floor(indice / partida.lado) + 1;
          const columna = (indice % partida.lado) + 1;
          const esInicio = partida.inicio === indice;
          const fallida = partida.fallidas.includes(indice);
          const marcada = partida.marcadas.includes(indice);

          const estilo = esInicio
            ? 'border-jade-hondo bg-jade-hondo text-papel'
            : fallida
              ? 'border-alerta bg-papel'
              : marcada
                ? 'border-oro-borde bg-oro-tinte text-jade-hondo'
                : 'border-borde bg-papel hover:border-jade';

          return (
            <button
              key={indice}
              type="button"
              onClick={() => setPartida(tocarCasilla(partida, indice))}
              aria-pressed={esInicio}
              aria-label={`Fila ${fila}, columna ${columna}: ${letra}`}
              lang="mam"
              className={`mam flex aspect-square items-center justify-center rounded-lg border-2 text-lg leading-none font-bold ${estilo}`}
            >
              {letra}
            </button>
          );
        })}
      </div>

      <div aria-live="polite">
        {partida.inicio !== null && (
          <p className="mt-3 text-tinta-suave">Ahora toca la última letra de la palabra.</p>
        )}
        {partida.fallidas.length > 0 && (
          <p className="mt-3 text-tinta-suave">Esa no es una de las palabras. Prueba otra vez.</p>
        )}
        {ultima !== undefined &&
          partida.inicio === null &&
          partida.fallidas.length === 0 &&
          !terminada && (
            <p className="mt-3">
              ¡Encontraste{' '}
              <span lang="mam" className="mam font-bold text-jade-hondo">
                {partida.palabras[ultima]!.palabra.mam}
              </span>
              !
            </p>
          )}
      </div>

      <h2 className="mt-6 text-xl">Busca estas palabras</h2>
      <ul className="mt-3 flex flex-col gap-2">
        {partida.palabras.map(({ palabra }, indice) => {
          const hallada = partida.encontradas.includes(indice);
          return (
            <li key={palabra.id} className="flex flex-wrap items-baseline gap-x-2 text-lg">
              {hallada ? (
                <>
                  <s className="text-tinta-suave">{palabra.espanol}</s>
                  <span aria-hidden="true">→</span>
                  <span lang="mam" className="mam text-xl font-bold text-jade-hondo">
                    {palabra.mam}
                  </span>
                </>
              ) : (
                <span>{palabra.espanol}</span>
              )}
            </li>
          );
        })}
      </ul>

      {terminada && (
        <div className="mt-6 rounded-xl border border-oro-borde bg-oro-tinte p-5">
          <p className="text-xl font-bold text-jade-hondo">
            ¡Encontraste las {total} palabras en {partida.intentos} intentos!
          </p>
          <button
            type="button"
            onClick={() => setPartida(nuevaPartidaSopa(palabras))}
            className="mt-5 min-h-11 rounded-xl bg-jade-hondo px-5 py-2 font-bold text-papel hover:bg-jade"
          >
            Jugar otra vez
          </button>
        </div>
      )}
    </section>
  );
}
