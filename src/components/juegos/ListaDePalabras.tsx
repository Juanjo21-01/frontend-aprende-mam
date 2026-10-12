/**
 * Las palabras de la partida, como lista para leer.
 *
 * Es lo que se ve **antes** de que la isla arranque: el orden al azar solo existe en el
 * navegador, así que el HTML compilado no puede traer una partida ya repartida. En un teléfono
 * lento, o si el JavaScript no llega, el estudiante tiene igual el vocabulario del tema delante
 * en vez de un hueco. Lo comparten los tres juegos.
 */
import type { PalabraDeJuego } from '@/data/juegos';

interface Props {
  palabras: readonly PalabraDeJuego[];
}

export default function ListaDePalabras({ palabras }: Props) {
  return (
    <div className="rounded-xl border border-borde bg-papel-hondo p-5">
      <p className="font-bold">Preparando el juego…</p>
      <p className="mt-1 text-tinta-suave">Mientras tanto, estas son las palabras del tema.</p>

      <dl className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2">
        {palabras.map((palabra) => (
          <div key={palabra.id} className="flex flex-wrap items-baseline gap-x-2">
            <dt lang="mam" className="mam text-lg font-bold text-jade-hondo">
              {palabra.mam}
            </dt>
            <dd>{palabra.espanol}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
