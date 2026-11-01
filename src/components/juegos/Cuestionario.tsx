/** Cuestionario de práctica: una pregunta cada vez, sin reloj ni penalizaciones nuevas. */
import { useEffect, useRef, useState } from 'react';
import {
  acerto, aciertos, cuestionarioTerminado, nuevaPartidaCuestionario, preguntasDesdeVocabulario,
  responder, siguiente, type PalabraDeJuego, type PartidaCuestionario, type Pregunta,
} from '@/data/juegos';
import ListaDePalabras from './ListaDePalabras';
import { BOTON_JUEGO, FichaPalabra, Marca, MensajeJuego } from './ElementosJuego';

interface Props { palabras: PalabraDeJuego[] }
const nueva = (palabras: PalabraDeJuego[]) => nuevaPartidaCuestionario(preguntasDesdeVocabulario(palabras));

export default function Cuestionario({ palabras }: Props) {
  const [partida, setPartida] = useState<PartidaCuestionario | null>(null);
  const botonSiguiente = useRef<HTMLButtonElement>(null);
  const tituloPregunta = useRef<HTMLHeadingElement>(null);
  const tituloResultado = useRef<HTMLHeadingElement>(null);
  const enfocarInicio = useRef(false);
  const respondida = partida !== null && partida.respuestas[partida.actual] != null;
  const terminada = partida !== null && cuestionarioTerminado(partida);

  useEffect(() => setPartida(nueva(palabras)), [palabras]);
  // El siguiente paso lleva al enunciado nuevo; la hidratación inicial conserva el foco.
  useEffect(() => {
    if (enfocarInicio.current) {
      (terminada ? tituloResultado : tituloPregunta).current?.focus();
      enfocarInicio.current = false;
    } else if (respondida) botonSiguiente.current?.focus();
  }, [partida, respondida, terminada]);

  if (partida === null) return <ListaDePalabras palabras={palabras} />;
  const total = partida.preguntas.length;
  if (total === 0) return <MensajeJuego tipo="pista" titulo="Este tema todavía no tiene palabras distintas suficientes para jugar." />;

  if (terminada) {
    const falladas = partida.preguntas.filter((_, i) => !acerto(partida, i));
    return (
      <section className="max-w-2xl" aria-labelledby="cuestionario-resultado">
        <div className="rounded-2xl bg-verde-tinte p-5 text-verde-texto">
          <div className="flex items-start gap-3">
            <Marca tipo="acierto" animar />
            <h2 id="cuestionario-resultado" ref={tituloResultado} tabIndex={-1} className="text-2xl leading-tight">
              ¡Terminaste el cuestionario!
            </h2>
          </div>
          <p className="mt-3 text-xl font-bold">Acertaste {aciertos(partida)} de {total}.</p>
          <p className="mt-2">{falladas.length > 0 ? 'Puedes repasar estas palabras y volver a intentarlo.' : '¡Reconociste todas las palabras de esta partida!'}</p>
        </div>
        {falladas.length > 0 && (
          <section className="mt-6" aria-labelledby="cuestionario-repaso">
            <h3 id="cuestionario-repaso" className="text-xl">Para repasar</h3>
            <dl className="mt-3 flex flex-col gap-4">
              {falladas.filter((pregunta) => pregunta.palabra).map((pregunta, i) => (
                <FichaPalabra key={i} palabra={pregunta.palabra!} />
              ))}
            </dl>
            {falladas.filter((pregunta) => !pregunta.palabra).map((pregunta, i) => (
              <p key={i} className="mt-3">{pregunta.retroalimentacion ?? pregunta.enunciado}</p>
            ))}
          </section>
        )}
        <button type="button" className={`mt-6 ${BOTON_JUEGO}`}
          onClick={() => { enfocarInicio.current = true; setPartida(nueva(palabras)); }}>
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
    <section className="max-w-2xl" aria-labelledby="cuestionario-pregunta">
      <p className="flex flex-wrap items-center gap-x-6 gap-y-1 font-bold tabular-nums">
        <span>Pregunta {partida.actual + 1} de {total}</span>
        <span className="text-base font-normal text-tinta-suave">Aciertos: {aciertos(partida)}</span>
      </p>
      <h2 id="cuestionario-pregunta" ref={tituloPregunta} tabIndex={-1} className="mt-5 text-xl leading-relaxed">
        <Enunciado pregunta={pregunta} />
      </h2>
      <p className="mt-2 text-tinta-suave">Escoge una respuesta.</p>
      <ul className="mt-5 flex flex-col gap-3" aria-label="Respuestas">
        {pregunta.opciones.map((opcion, indice) => {
          const marcada = respondida && (opcion.es_correcta || indice === elegida);
          const estilo = !respondida
            ? 'tocable border-borde bg-papel hover:border-rojo [--tocable-sombra:var(--color-borde)]'
            : opcion.es_correcta
              ? 'border-verde bg-verde-tinte text-verde-texto'
              : indice === elegida
                ? 'border-rojo bg-rojo-tinte text-rojo-texto'
                : 'border-borde bg-papel text-tinta-suave';
          return (
            <li key={indice}>
              <button type="button" disabled={respondida} onClick={() => setPartida(responder(partida, indice))}
                className={`flex min-h-16 w-full flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-2xl border-2 px-4 py-3 text-left ${estilo}`}>
                {opcion.idioma === 'mam'
                  ? <span lang="mam" className="mam min-w-0 text-xl font-bold [overflow-wrap:anywhere]">{opcion.texto}</span>
                  : <span className="min-w-0 text-lg [overflow-wrap:anywhere]">{opcion.texto}</span>}
                {marcada && (
                  <span className="inline-flex items-center gap-2 text-base font-bold">
                    <Marca tipo={opcion.es_correcta ? 'acierto' : 'error'} />
                    <span>{opcion.es_correcta ? 'Correcta' : 'Tu respuesta'}</span>
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="mt-5" aria-live="polite" aria-atomic="true">
        {respondida && (
          <div id="cuestionario-retroalimentacion">
            <MensajeJuego tipo={bien ? 'acierto' : 'error'} titulo={bien ? '¡Correcto!' : 'No era esa. Esta es la palabra correcta:'}>
              {pregunta.palabra
                ? <dl><FichaPalabra palabra={pregunta.palabra} /></dl>
                : pregunta.retroalimentacion ? <p>{pregunta.retroalimentacion}</p> : null}
            </MensajeJuego>
          </div>
        )}
      </div>
      {respondida && (
        <button ref={botonSiguiente} type="button" aria-describedby="cuestionario-retroalimentacion"
          onClick={() => { enfocarInicio.current = true; setPartida(siguiente(partida)); }}
          className={`mt-5 ${BOTON_JUEGO}`}>
          {ultima ? 'Ver resultado' : 'Siguiente pregunta'}
        </button>
      )}
    </section>
  );
}

function Enunciado({ pregunta }: { pregunta: Pregunta }) {
  const { termino } = pregunta;
  if (!termino) return <>{pregunta.enunciado}</>;
  return termino.idioma === 'mam' ? (
    <>¿Qué significa <span lang="mam" className="mam text-3xl font-bold [overflow-wrap:anywhere]">{termino.texto}</span>?</>
  ) : (
    <>¿Cómo se dice <strong className="text-2xl">«{termino.texto}»</strong> en <span lang="mam">Mam</span>?</>
  );
}
