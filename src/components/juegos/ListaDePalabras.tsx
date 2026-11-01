/**
 * Las palabras de la partida, como lista para leer.
 *
 * Es lo que se ve **antes** de que la isla arranque: el orden al azar solo existe en el
 * navegador, así que el HTML compilado no puede traer una partida ya repartida. En un teléfono
 * lento, o si el JavaScript no llega, el estudiante tiene igual el vocabulario del tema delante
 * en vez de un hueco. Lo comparten los tres juegos.
 */
import type { PalabraDeJuego } from '@/data/juegos';
import { FichaPalabra } from './ElementosJuego';

interface Props {
  palabras: readonly PalabraDeJuego[];
}

export default function ListaDePalabras({ palabras }: Props) {
  return (
    <div className="rounded-2xl bg-papel-hondo p-5">
      <p className="font-bold">Palabras para practicar</p>
      <p className="mt-1 text-tinta-suave">El juego aparecerá aquí cuando esté listo. Mientras tanto, puedes repasar estas palabras.</p>
      <noscript><p className="mt-3">Activa JavaScript para jugar. También puedes estudiar esta lista sin activarlo.</p></noscript>

      <dl className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2">
        {palabras.map((palabra) => (
          <FichaPalabra key={palabra.id} palabra={palabra} />
        ))}
      </dl>
    </div>
  );
}
