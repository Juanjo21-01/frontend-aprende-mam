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
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';

import {
  nuevaPartidaSopa,
  sopaTerminada,
  tocarCasilla,
  type PalabraDeJuego,
  type PartidaSopa,
} from '@/data/juegos';
import ListaDePalabras from './ListaDePalabras';
import { BOTON_JUEGO, Marca, MensajeJuego } from './ElementosJuego';

interface Props {
  palabras: PalabraDeJuego[];
}

export default function SopaDeLetras({ palabras }: Props) {
  // `null` en el HTML compilado: el reparto al azar solo puede hacerse en el navegador.
  const [partida, setPartida] = useState<PartidaSopa | null>(null);
  const [activa, setActiva] = useState(0);
  const botones = useRef<(HTMLButtonElement | null)[]>([]);
  const resultado = useRef<HTMLHeadingElement>(null);
  const enfocarAlRepartir = useRef(false);
  const instruccionesId = useId();
  const tecladoId = useId();
  const pistasId = useId();
  const terminada = partida !== null && sopaTerminada(partida);

  useEffect(() => {
    setPartida(nuevaPartidaSopa(palabras));
    setActiva(0);
  }, [palabras]);

  useEffect(() => {
    if (terminada) resultado.current?.focus();
  }, [terminada]);

  useEffect(() => {
    if (enfocarAlRepartir.current && partida !== null) {
      enfocarAlRepartir.current = false;
      botones.current[0]?.focus();
    }
  }, [partida]);

  if (partida === null) return <ListaDePalabras palabras={palabras} />;

  const total = partida.palabras.length;
  const ultima = partida.encontradas.at(-1);
  const anchoMinimo = partida.lado * 44 + (partida.lado - 1) * 4;
  const anchoMaximo = partida.lado * 52 + (partida.lado - 1) * 4;

  function mover(evento: KeyboardEvent<HTMLButtonElement>, indice: number) {
    if (partida === null) return;
    const fila = Math.floor(indice / partida.lado);
    const columna = indice % partida.lado;
    let destino = indice;

    switch (evento.key) {
      case 'ArrowLeft':
        destino = fila * partida.lado + Math.max(0, columna - 1);
        break;
      case 'ArrowRight':
        destino = fila * partida.lado + Math.min(partida.lado - 1, columna + 1);
        break;
      case 'ArrowUp':
        destino = Math.max(0, fila - 1) * partida.lado + columna;
        break;
      case 'ArrowDown':
        destino = Math.min(partida.lado - 1, fila + 1) * partida.lado + columna;
        break;
      case 'Home':
        destino = evento.ctrlKey ? 0 : fila * partida.lado;
        break;
      case 'End':
        destino = evento.ctrlKey ? partida.casillas.length - 1 : (fila + 1) * partida.lado - 1;
        break;
      default:
        return;
    }

    evento.preventDefault();
    setActiva(destino);
    botones.current[destino]?.focus();
  }

  function repetir() {
    enfocarAlRepartir.current = true;
    setActiva(0);
    setPartida(nuevaPartidaSopa(palabras));
  }

  return (
    <section aria-label="Partida de sopa de letras">
      <p id={instruccionesId} className="max-w-[68ch] text-tinta-suave">
        Busca la palabra en <span lang="mam">Mam</span> de cada pista. Toca su primera letra
        y después la última. Las palabras van hacia la derecha o hacia abajo.
      </p>

      <p className="mt-4 flex flex-wrap gap-x-6 gap-y-1 font-bold tabular-nums">
        <span>Palabras: {partida.encontradas.length} de {total}</span>
        <span className="font-normal text-tinta-suave">Intentos: {partida.intentos}</span>
      </p>

      <div className="mt-5 grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(12rem,0.65fr)] lg:items-start">
        <div className="min-w-0">
          <p className="mb-2 text-base text-tinta-suave">
            Si el tablero no cabe, deslízalo hacia los lados.
          </p>
          <p id={tecladoId} className="sr-only">
            Usa las flechas para moverte entre letras y Enter o espacio para elegir. Inicio y
            Fin van al extremo de la fila; con Control, al extremo del tablero. Tab sale del tablero.
          </p>

          <div role="region" aria-label="Zona desplazable del tablero" className="-mx-2 overflow-x-auto p-2">
            <div
              role="grid"
              aria-label="Letras de la sopa"
              aria-describedby={`${instruccionesId} ${tecladoId}`}
              aria-rowcount={partida.lado}
              aria-colcount={partida.lado}
              className="grid w-full gap-1"
              style={{ minWidth: anchoMinimo, maxWidth: anchoMaximo }}
            >
              {Array.from({ length: partida.lado }, (_, fila) => (
                <div
                  key={fila}
                  role="row"
                  className="grid gap-1"
                  style={{ gridTemplateColumns: `repeat(${partida.lado}, minmax(44px, 1fr))` }}
                >
                  {Array.from({ length: partida.lado }, (_, columna) => {
                    const indice = fila * partida.lado + columna;
                    const letra = partida.casillas[indice]!;
                    const esInicio = partida.inicio === indice;
                    const fallida = partida.fallidas.includes(indice);
                    const marcada = partida.marcadas.includes(indice);
                    const estado = esInicio
                      ? ', inicio seleccionado'
                      : fallida
                        ? ', selección sin coincidencia'
                        : marcada
                          ? ', parte de una palabra encontrada'
                          : '';
                    const estilo = esInicio
                      ? 'border-tinta bg-amarillo-campo text-amarillo-texto'
                      : fallida
                        ? 'border-rojo-texto bg-rojo-tinte text-rojo-texto'
                        : marcada
                          ? 'border-verde-texto bg-verde-tinte text-verde-texto'
                          : 'border-borde bg-papel text-tinta hover:border-rojo-texto';

                    return (
                      <div key={columna} role="gridcell" aria-rowindex={fila + 1} aria-colindex={columna + 1}>
                        <button
                          ref={(boton) => { botones.current[indice] = boton; }}
                          type="button"
                          disabled={terminada}
                          tabIndex={activa === indice && !terminada ? 0 : -1}
                          onFocus={() => setActiva(indice)}
                          onKeyDown={(evento) => mover(evento, indice)}
                          onClick={() => setPartida(tocarCasilla(partida, indice))}
                          aria-pressed={esInicio}
                          aria-label={`Fila ${fila + 1}, columna ${columna + 1}: ${letra}${estado}`}
                          className={`relative flex aspect-square min-h-11 w-full min-w-11 items-center justify-center rounded-lg border-2 text-lg leading-none font-bold ${estilo}`}
                        >
                          <span lang="mam" className={`mam ${marcada ? 'underline decoration-2 underline-offset-4' : ''}`}>
                            {letra}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div role="status" aria-live="polite" aria-atomic="true" className="mt-4">
            {!terminada && (
              partida.inicio !== null ? (
                <MensajeJuego tipo="pista" titulo="Primera letra elegida">
                  Ahora toca la última letra. Para soltar la selección, toca otra vez la primera.
                </MensajeJuego>
              ) : partida.fallidas.length > 0 ? (
                <MensajeJuego tipo="error" titulo="Esa no es una de las palabras">
                  Mira las pistas y prueba otra vez.
                </MensajeJuego>
              ) : ultima !== undefined ? (
                <MensajeJuego key={partida.encontradas.length} tipo="acierto" titulo="¡Palabra encontrada!">
                  <span lang="mam" className="mam text-xl font-bold">
                    {partida.palabras[ultima]!.palabra.mam}
                  </span>{' '}
                  significa {partida.palabras[ultima]!.palabra.espanol}.
                </MensajeJuego>
              ) : (
                <p className="text-base text-tinta-suave">Escoge una pista y busca su palabra.</p>
              )
            )}
          </div>
        </div>

        <section aria-labelledby={pistasId} className="min-w-0">
          <h2 id={pistasId} className="text-xl">Busca estas palabras</h2>
          <ul className="mt-3 divide-y divide-borde">
            {partida.palabras.map(({ palabra }, indice) => {
              const hallada = partida.encontradas.includes(indice);
              return (
                <li key={palabra.id} className="flex items-start gap-3 py-3 first:pt-0">
                  {hallada ? (
                    <span className="mt-1 text-verde-texto"><Marca tipo="acierto" /></span>
                  ) : (
                    <span className="mt-1 size-6 shrink-0 rounded-md border-2 border-borde" aria-hidden="true" />
                  )}
                  <div className="min-w-0 break-words">
                    <span className="block text-lg">{palabra.espanol}</span>
                    {hallada && (
                      <>
                        <span lang="mam" className="mam block text-xl font-bold text-verde-texto">
                          {palabra.mam}
                        </span>
                        <span className="block text-base text-verde-texto">Encontrada</span>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      {terminada && (
        <section className="mt-6 rounded-2xl bg-verde-tinte p-5 text-verde-texto">
          <div className="flex items-start gap-3">
            <Marca tipo="acierto" animar />
            <div>
              <h2 ref={resultado} tabIndex={-1} className="text-2xl">¡Encontraste todas las palabras!</h2>
              <p className="mt-2">
                {total} palabras en {partida.intentos} intentos. Puedes volver a practicar con otro tablero.
              </p>
            </div>
          </div>
          <button type="button" onClick={repetir} className={`mt-5 ${BOTON_JUEGO}`}>
            Jugar otra vez
          </button>
        </section>
      )}
    </section>
  );
}
