/**
 * Cuestionario: preguntas de opción múltiple, una a la vez.
 *
 * Toda la mecánica está en `src/data/juegos.ts` y probada en Node; aquí solo se pinta.
 *
 * Hoy las preguntas salen del vocabulario, pero la isla trabaja con la forma genérica
 * `Pregunta` —la de las tablas `preguntas` y `opciones` del backend—, así que un cuestionario
 * redactado a mano entra por aquí sin cambios: si no trae `termino` ni `palabra`, se muestra el
 * enunciado y la retroalimentación, y nada más.
 *
 * La respuesta correcta se enseña en cuanto se responde, con la ficha de la palabra: el
 * cuestionario es para aprender, no para examinar.
 */
import { useEffect, useRef, useState } from 'react';

import {
  acerto,
  aciertos,
  cuestionarioTerminado,
  nuevaPartidaCuestionario,
  preguntasDesdeVocabulario,
  responder,
  siguiente,
  type PalabraDeJuego,
  type PartidaCuestionario,
  type Pregunta,
} from '@/data/juegos';
import ListaDePalabras from './ListaDePalabras';

interface Props {
  palabras: PalabraDeJuego[];
}

const nueva = (palabras: PalabraDeJuego[]) =>
  nuevaPartidaCuestionario(preguntasDesdeVocabulario(palabras));

export default function Cuestionario({ palabras }: Props) {
  // `null` en el HTML compilado: el reparto al azar solo puede hacerse en el navegador.
  const [partida, setPartida] = useState<PartidaCuestionario | null>(null);
  const botonSiguiente = useRef<HTMLButtonElement>(null);

  useEffect(() => setPartida(nueva(palabras)), [palabras]);

  const respondida = partida !== null && partida.respuestas[partida.actual] != null;

  // Al responder, el foco pasa a «Siguiente»: con teclado se juega con Tab y Enter sin buscar
  // el botón, y el lector de pantalla llega a la retroalimentación justo antes.
  useEffect(() => {
    if (respondida) botonSiguiente.current?.focus();
  }, [respondida]);

  if (partida === null) return <ListaDePalabras palabras={palabras} />;

  const total = partida.preguntas.length;

  if (cuestionarioTerminado(partida)) {
    const falladas = partida.preguntas.filter((_, i) => !acerto(partida, i));

    return (
      <section className="rounded-xl border border-oro-borde bg-oro-tinte p-5">
        <p className="text-xl font-bold text-jade-hondo">
          Acertaste {aciertos(partida)} de {total}.
        </p>

        {falladas.length > 0 && (
          <>
            <h2 className="mt-5 text-lg">Para repasar</h2>
            <dl className="mt-2 flex flex-col gap-2">
              {falladas.map((pregunta, i) =>
                pregunta.palabra ? (
                  <Ficha key={i} palabra={pregunta.palabra} />
                ) : (
                  <p key={i}>{pregunta.retroalimentacion ?? pregunta.enunciado}</p>
                )
              )}
            </dl>
          </>
        )}

        <button
          type="button"
          onClick={() => setPartida(nueva(palabras))}
          className="mt-5 min-h-11 rounded-xl bg-jade-hondo px-5 py-2 font-bold text-papel hover:bg-jade"
        >
          Jugar otra vez
        </button>
      </section>
    );
  }

  const pregunta = partida.preguntas[partida.actual]!;
  const elegida = partida.respuestas[partida.actual];
  const bien = respondida && acerto(partida, partida.actual);
  const ultima = partida.actual === total - 1;

  return (
    <section>
      <p className="flex flex-wrap gap-x-6 font-bold">
        <span>
          Pregunta {partida.actual + 1} de {total}
        </span>
        <span>Aciertos: {aciertos(partida)}</span>
      </p>

      <div className="mt-4 rounded-xl border border-borde p-5">
        <Enunciado pregunta={pregunta} />

        <ul className="mt-5 flex flex-col gap-3">
          {pregunta.opciones.map((opcion, indice) => {
            const estilo = !respondida
              ? 'border-borde bg-papel hover:border-jade'
              : opcion.es_correcta
                ? 'border-jade bg-papel'
                : indice === elegida
                  ? 'border-alerta bg-papel'
                  : 'border-borde bg-papel opacity-60';

            return (
              <li key={indice}>
                <button
                  type="button"
                  disabled={respondida}
                  onClick={() => setPartida(responder(partida, indice))}
                  className={`flex min-h-14 w-full items-center justify-between gap-3 rounded-xl border-2 px-4 py-2 text-left ${estilo}`}
                >
                  {opcion.idioma === 'mam' ? (
                    <span lang="mam" className="mam text-xl font-bold text-jade-hondo">
                      {opcion.texto}
                    </span>
                  ) : (
                    <span className="text-lg">{opcion.texto}</span>
                  )}
                  {respondida && (opcion.es_correcta || indice === elegida) && (
                    <Marca correcta={opcion.es_correcta} />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div aria-live="polite">
        {respondida && (
          <div className="mt-4 rounded-xl border border-borde bg-papel-hondo p-4">
            <p className={`font-bold ${bien ? 'text-jade-hondo' : 'text-alerta'}`}>
              {bien ? '¡Correcto!' : 'No era esa.'}
            </p>
            {pregunta.palabra ? (
              <dl className="mt-2">
                <Ficha palabra={pregunta.palabra} />
              </dl>
            ) : (
              pregunta.retroalimentacion && <p className="mt-2">{pregunta.retroalimentacion}</p>
            )}
          </div>
        )}
      </div>

      {respondida && (
        <button
          ref={botonSiguiente}
          type="button"
          onClick={() => setPartida(siguiente(partida))}
          className="mt-4 min-h-11 rounded-xl bg-jade-hondo px-5 py-2 font-bold text-papel hover:bg-jade"
        >
          {ultima ? 'Ver resultado' : 'Siguiente pregunta'}
        </button>
      )}
    </section>
  );
}

function Enunciado({ pregunta }: { pregunta: Pregunta }) {
  const { termino } = pregunta;

  if (!termino) return <p className="text-xl font-bold">{pregunta.enunciado}</p>;

  // El término va grande y aparte: es lo que hay que leer, y en Mam con su tipografía.
  return termino.idioma === 'mam' ? (
    <p className="text-xl">
      ¿Qué significa{' '}
      <span lang="mam" className="mam text-3xl font-bold text-jade-hondo">
        {termino.texto}
      </span>
      ?
    </p>
  ) : (
    <p className="text-xl">
      ¿Cómo se dice <strong className="text-2xl">«{termino.texto}»</strong> en{' '}
      <span lang="mam">Mam</span>?
    </p>
  );
}

function Marca({ correcta }: { correcta: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={correcta ? 'Correcta' : 'Tu respuesta'}
      className={`shrink-0 ${correcta ? 'text-jade' : 'text-alerta'}`}
    >
      {correcta ? <path d="M5 12.5 10 17.5 19 7" /> : <path d="M6 6 18 18M18 6 6 18" />}
    </svg>
  );
}

function Ficha({ palabra }: { palabra: PalabraDeJuego }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2">
      <dt lang="mam" className="mam text-xl font-bold text-jade-hondo">
        {palabra.mam}
      </dt>
      <dd className="flex flex-wrap items-baseline gap-x-2">
        <span className="text-lg">{palabra.espanol}</span>
        {palabra.clase && <span className="text-sm text-tinta-suave italic">{palabra.clase}</span>}
      </dd>
    </div>
  );
}
