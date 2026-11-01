/** Memoria: las cartas fallidas quedan visibles hasta el siguiente toque, sin reloj. */
import { useEffect, useRef, useState } from 'react';
import {
  hayFallo, memoriaTerminada, nuevaPartidaMemoria, voltear,
  type Carta, type PalabraDeJuego, type PartidaMemoria,
} from '@/data/juegos';
import ListaDePalabras from './ListaDePalabras';
import { BOTON_JUEGO, FichaPalabra, Marca, MensajeJuego } from './ElementosJuego';

interface Props { palabras: PalabraDeJuego[] }

export default function Memoria({ palabras }: Props) {
  const [partida, setPartida] = useState<PartidaMemoria | null>(null);
  const inicio = useRef<HTMLHeadingElement>(null);
  const resultado = useRef<HTMLHeadingElement>(null);
  const volverAlTablero = useRef(false);
  const terminada = partida !== null && memoriaTerminada(partida);

  useEffect(() => setPartida(nuevaPartidaMemoria(palabras)), [palabras]);
  // Solo terminar y reiniciar mueven el foco; la hidratación inicial no lo roba.
  useEffect(() => {
    if (terminada) resultado.current?.focus();
    else if (volverAlTablero.current) {
      inicio.current?.focus();
      volverAlTablero.current = false;
    }
  }, [partida, terminada]);

  if (partida === null) return <ListaDePalabras palabras={palabras} />;
  const total = partida.palabras.length;
  const fallo = hayFallo(partida);
  const ultima = partida.encontradas.at(-1);
  if (total === 0) return <MensajeJuego tipo="pista" titulo="Este tema todavía no tiene palabras distintas suficientes para jugar." />;

  return (
    <section className="max-w-3xl" aria-labelledby="memoria-inicio">
      <h2 id="memoria-inicio" ref={inicio} tabIndex={-1} className="text-xl">Encuentra las parejas</h2>
      <p className="mt-2 max-w-[68ch] text-tinta-suave">
        Toca dos cartas: una palabra en <span lang="mam">Mam</span> y su significado en
        castellano. Si coinciden, se quedan a la vista.
      </p>
      <p className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-1 font-bold tabular-nums">
        <span>Parejas: {partida.encontradas.length} de {total}</span>
        <span className="text-base font-normal text-tinta-suave">Intentos: {partida.intentos}</span>
      </p>
      {!terminada && (
        <div className="mt-4 min-h-24" aria-live="polite" aria-atomic="true">
          {fallo ? (
            <MensajeJuego tipo="error" titulo="No son pareja.">
              <p>Léelas con calma. Toca otra carta para seguir.</p>
            </MensajeJuego>
          ) : ultima !== undefined && partida.arriba.length === 0 ? (
            <MensajeJuego key={ultima} tipo="acierto" titulo="¡Pareja encontrada!">
              <dl><FichaPalabra palabra={partida.palabras[ultima]!} /></dl>
            </MensajeJuego>
          ) : (
            <MensajeJuego tipo="pista" titulo={partida.arriba.length === 0 ? 'Toca una carta para empezar.' : 'Ahora busca su pareja.'} />
          )}
        </div>
      )}
      <ul className="mt-5 grid grid-cols-2 gap-3 min-[480px]:grid-cols-4" aria-label="Cartas de memoria">
        {partida.cartas.map((carta, indice) => {
          const emparejada = partida.encontradas.includes(carta.par);
          return (
            <li key={indice} className="min-w-0">
              <CartaMemoria carta={carta} numero={indice + 1}
                visible={emparejada || partida.arriba.includes(indice)} emparejada={emparejada}
                fallida={fallo && partida.arriba.includes(indice)}
                alTocar={() => setPartida(voltear(partida, indice))} />
            </li>
          );
        })}
      </ul>
      {terminada && (
        <div className="mt-6 rounded-2xl bg-verde-tinte p-5 text-verde-texto">
          <div className="flex items-start gap-3">
            <Marca tipo="acierto" animar />
            <h2 ref={resultado} tabIndex={-1} className="text-2xl leading-tight">¡Encontraste todas las parejas!</h2>
          </div>
          <p className="mt-3">{total} parejas en {partida.intentos} intentos.</p>
          <dl className="mt-5 flex flex-col gap-3">
            {partida.encontradas.map((par) => <FichaPalabra key={par} palabra={partida.palabras[par]!} />)}
          </dl>
          <button type="button" className={`mt-6 ${BOTON_JUEGO}`}
            onClick={() => { volverAlTablero.current = true; setPartida(nuevaPartidaMemoria(palabras)); }}>
            Jugar otra vez
          </button>
        </div>
      )}
    </section>
  );
}

interface PropsCarta {
  carta: Carta; numero: number; visible: boolean; emparejada: boolean; fallida: boolean; alTocar: () => void;
}

function CartaMemoria({ carta, numero, visible, emparejada, fallida, alTocar }: PropsCarta) {
  const estilo = emparejada
    ? 'border-transparent bg-verde-tinte text-verde-texto'
    : !visible
      ? 'tocable border-transparent bg-rojo-campo text-rojo-texto hover:bg-rojo-tinte [--tocable-sombra:var(--color-rojo)]'
      : fallida
        ? 'tocable border-rojo bg-rojo-tinte text-rojo-texto [--tocable-sombra:var(--color-rojo)]'
        : 'tocable border-rojo bg-papel text-tinta [--tocable-sombra:var(--color-rojo)]';
  return (
    <button type="button" onClick={emparejada ? undefined : alTocar}
      aria-disabled={emparejada || undefined} tabIndex={emparejada ? -1 : 0}
      aria-pressed={emparejada ? undefined : visible}
      aria-label={visible
        ? `Carta ${numero}${emparejada ? ', pareja encontrada' : fallida ? ', no es pareja' : ''}: ${carta.texto}`
        : `Carta ${numero}, boca abajo. Voltear`}
      className={`flex h-full min-h-32 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 p-3 text-center [overflow-wrap:anywhere] ${estilo}`}>
      {!visible ? (
        <>
          <span className="text-3xl font-bold tabular-nums" aria-hidden="true">{numero}</span>
          <span className="text-lg">Voltear</span>
        </>
      ) : (
        <>
          {carta.cara === 'mam'
            ? <span lang="mam" className="mam text-xl leading-snug font-bold">{carta.texto}</span>
            : <span className="text-lg leading-snug">{carta.texto}</span>}
          {(emparejada || fallida) && (
            <span className="flex flex-wrap items-center justify-center gap-1 text-base font-bold">
              <Marca tipo={emparejada ? 'acierto' : 'error'} />
              <span>{emparejada ? 'Pareja' : 'No coincide'}</span>
            </span>
          )}
        </>
      )}
    </button>
  );
}
