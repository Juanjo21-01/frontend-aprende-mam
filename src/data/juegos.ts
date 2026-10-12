/**
 * La lógica de los juegos, sin React y sin nada que dependa del navegador o de Node.
 *
 * Vive aparte de las islas por la misma razón que `busqueda.ts`: una isla no se puede probar
 * desde la sesión de desarrollo —el panel del navegador suele estar oculto y `client:visible`
 * no hidrata—, pero este módulo sí, con `node --test` contra la exportación real. Todo lo que
 * puede salir mal en un juego sin que nadie lo vea (una pareja imposible de formar, una letra
 * partida en dos casillas) se decide aquí y se prueba aquí. Las islas solo pintan.
 *
 * Las importaciones llevan la extensión `.ts` porque Node la exige para cargar TypeScript
 * directamente; Astro la acepta igual.
 */
import { GRAFEMAS } from './alfabeto.ts';
import type { Categoria, Entrada } from './vocabulario.ts';

/**
 * Menos palabras que esto y el tema no se ofrece para jugar. Con 4 sale un memoria de 8
 * cartas y un cuestionario con 4 opciones; con menos, ni eso. Es bajo a propósito: con las 42
 * entradas de la primera exportación, «números» tiene justo 4. Subirlo cuando entre el corpus.
 */
export const MINIMO_POR_TEMA = 4;

/** Parejas por partida de memoria: 16 cartas, una cuadrícula de 4×4 que cabe en un teléfono. */
export const PAREJAS_MEMORIA = 8;

/** Lo que una isla de juego necesita de cada entrada. Se le pasa como prop desde la página. */
export interface PalabraDeJuego {
  id: number;
  /** Ortografía canónica. Se muestra tal cual. */
  mam: string;
  espanol: string;
  clase: string | null;
  /** Clave de intercalación: de aquí salen las letras, no de `mam`. */
  orden: string;
}

export function aPalabraDeJuego(entrada: Entrada): PalabraDeJuego {
  const { id, mam, espanol, clase, orden } = entrada;
  return { id, mam, espanol, clase, orden };
}

/** Los juegos del sitio. `listo` decide si el índice lo enlaza o lo anuncia como pendiente. */
export const JUEGOS = [
  {
    slug: 'memoria',
    nombre: 'Memoria',
    descripcion: 'Encuentra las parejas: cada palabra en Mam con su significado.',
    listo: true,
  },
  {
    slug: 'sopa-de-letras',
    nombre: 'Sopa de letras',
    descripcion: 'Busca en la cuadrícula la palabra en Mam que corresponde a cada pista.',
    listo: false,
  },
  {
    slug: 'cuestionario',
    nombre: 'Cuestionario',
    descripcion: 'Escoge la respuesta correcta: qué significa, o cómo se dice en Mam.',
    listo: false,
  },
] as const;

export type SlugDeJuego = (typeof JUEGOS)[number]['slug'];

/** Segmento de ruta de la partida que mezcla todos los temas. */
export const TODOS = 'todos';

/** Un tema con palabras suficientes para jugarlo. */
export interface TemaJugable {
  categoria: Categoria;
  palabras: PalabraDeJuego[];
}

/**
 * Los temas que se pueden jugar, en el orden del panel. Recibe la salida de `porTema()`.
 *
 * Revienta si un tema se llama como la ruta de «todos»: las dos páginas caerían en el mismo
 * archivo de `dist/` y una pisaría a la otra sin ningún error.
 */
export function temasJugables(
  grupos: { categoria: Categoria; entradas: Entrada[] }[]
): TemaJugable[] {
  if (grupos.some(({ categoria }) => categoria.slug === TODOS)) {
    throw new Error(`Hay un tema con el slug «${TODOS}», que es la ruta de la partida mezclada.`);
  }

  return grupos
    .filter(({ entradas }) => entradas.length >= MINIMO_POR_TEMA)
    .map(({ categoria, entradas }) => ({ categoria, palabras: entradas.map(aPalabraDeJuego) }));
}

/**
 * Las letras de una palabra, partidas como las partió el tokenizador del backend.
 *
 * La clave `orden` son dos dígitos por grafema —`tx’otx’` es `24 15 24`—, así que dice dónde
 * empieza y dónde acaba cada letra sin tener que decidir aquí si `tx’` es una letra o tres
 * caracteres. Repetir esa decisión en el cliente abriría la puerta a que las dos versiones
 * discrepen.
 *
 * Pero la clave sola no alcanza: `00` marca tanto el espacio como **cualquier carácter que no
 * está en el alfabeto**. Pasa de verdad: `tutz’bil` llega con una `b` sin saltillo, que en Mam
 * no existe, y su clave es `21 27 26 00 06 12`. Por eso se recorren la clave y la palabra a la
 * vez: cada posición conocida consume su grafema de `mam`, y cada `00` consume un carácter tal
 * cual. El resultado, unido, es siempre exactamente `mam`, que es lo que se muestra.
 */
export function grafemasDe({ mam, orden }: { mam: string; orden: string }): string[] {
  const fallo = (motivo: string): never => {
    throw new Error(`«${mam}» (${orden}): ${motivo}`);
  };

  if (!/^(\d\d)*$/.test(orden)) fallo('la clave no son pares de dígitos.');

  const caracteres = [...mam];
  const letras: string[] = [];
  let cursor = 0;

  for (let i = 0; i < orden.length; i += 2) {
    const posicion = Number.parseInt(orden.slice(i, i + 2), 10);

    if (posicion === 0) {
      if (cursor >= caracteres.length) fallo('la clave es más larga que la palabra.');
      letras.push(caracteres[cursor]!);
      cursor += 1;
      continue;
    }

    const grafema = GRAFEMAS[posicion - 1] ?? fallo(`la posición ${posicion} no está en el alfabeto.`);
    const largo = [...grafema].length;

    // El backend compara sin distinguir mayúsculas; aquí se conserva lo que trae `mam`.
    const tramo = caracteres.slice(cursor, cursor + largo).join('');
    if (tramo.toLocaleLowerCase('es') !== grafema) {
      fallo(`se esperaba «${grafema}» y la palabra trae «${tramo}».`);
    }

    letras.push(tramo);
    cursor += largo;
  }

  if (cursor !== caracteres.length) fallo('la palabra es más larga que la clave.');

  return letras;
}

/** Si alguna letra de la palabra no es del alfabeto Mam (ni espacio): un dato para revisar. */
export function tieneLetrasAjenas(palabra: { mam: string; orden: string }): boolean {
  const alfabeto = new Set<string>(GRAFEMAS);
  return grafemasDe(palabra).some((letra) => letra !== ' ' && !alfabeto.has(letra.toLocaleLowerCase('es')));
}

/** Fuente de azar. Las pruebas pasan una determinista; el navegador, `Math.random`. */
export type Azar = () => number;

/** Copia barajada (Fisher–Yates). No toca la lista original. */
export function barajar<T>(lista: readonly T[], azar: Azar = Math.random): T[] {
  const copia = [...lista];

  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1));
    [copia[i], copia[j]] = [copia[j]!, copia[i]!];
  }

  return copia;
}

/**
 * Hasta `cuantas` palabras al azar, sin dos que se escriban igual en Mam ni que signifiquen lo
 * mismo en castellano.
 *
 * En memoria, dos cartas con el mismo texto que no forman pareja entre sí son una trampa: el
 * niño acierta y el juego le dice que no. En el cuestionario, dos opciones idénticas tienen el
 * mismo problema. Con el corpus completo los sinónimos van a ser frecuentes.
 */
export function elegirDistintas(
  palabras: readonly PalabraDeJuego[],
  cuantas: number,
  azar: Azar = Math.random
): PalabraDeJuego[] {
  const elegidas: PalabraDeJuego[] = [];
  const mamVistos = new Set<string>();
  const espanolVistos = new Set<string>();

  for (const palabra of barajar(palabras, azar)) {
    if (elegidas.length === cuantas) break;

    const espanol = palabra.espanol.trim().toLocaleLowerCase('es');
    if (mamVistos.has(palabra.mam) || espanolVistos.has(espanol)) continue;

    mamVistos.add(palabra.mam);
    espanolVistos.add(espanol);
    elegidas.push(palabra);
  }

  return elegidas;
}

// ───────────────────────────────────────────────────────────────────────────── Memoria ──

export interface Carta {
  /** Índice de la pareja dentro de `palabras` de la partida. */
  par: number;
  cara: 'mam' | 'espanol';
  texto: string;
}

export interface PartidaMemoria {
  palabras: PalabraDeJuego[];
  cartas: Carta[];
  /**
   * Cartas boca arriba que todavía no son pareja. Con dos que no coinciden, se quedan a la
   * vista hasta el siguiente toque: sin temporizador, para que quien lee despacio alcance a
   * leer las dos antes de que se den vuelta.
   */
  arriba: number[];
  /** Parejas ya formadas, por índice en `palabras`. En el orden en que se encontraron. */
  encontradas: number[];
  intentos: number;
}

export function nuevaPartidaMemoria(
  palabras: readonly PalabraDeJuego[],
  azar: Azar = Math.random,
  parejas: number = PAREJAS_MEMORIA
): PartidaMemoria {
  const elegidas = elegirDistintas(palabras, parejas, azar);

  const cartas = elegidas.flatMap((palabra, par): Carta[] => [
    { par, cara: 'mam', texto: palabra.mam },
    { par, cara: 'espanol', texto: palabra.espanol },
  ]);

  return { palabras: elegidas, cartas: barajar(cartas, azar), arriba: [], encontradas: [], intentos: 0 };
}

/** Si dos cartas que no coinciden están esperando a darse vuelta. */
export function hayFallo(partida: PartidaMemoria): boolean {
  return partida.arriba.length === 2;
}

export function memoriaTerminada(partida: PartidaMemoria): boolean {
  return partida.palabras.length > 0 && partida.encontradas.length === partida.palabras.length;
}

/**
 * Tocar una carta. Devuelve la partida nueva; nunca modifica la que recibe.
 *
 * Tocar una carta ya emparejada, o la misma que ya está boca arriba, no cuenta como intento.
 * Si había dos cartas falladas a la vista, el toque las da vuelta y voltea la nueva en el
 * mismo gesto: así nunca hace falta un toque «perdido» solo para esconderlas.
 */
export function voltear(partida: PartidaMemoria, indice: number): PartidaMemoria {
  const carta = partida.cartas[indice];

  if (carta === undefined || partida.encontradas.includes(carta.par)) return partida;

  const previas = hayFallo(partida) ? [] : partida.arriba;

  if (previas.includes(indice)) return { ...partida, arriba: previas };

  const arriba = [...previas, indice];

  if (arriba.length < 2) return { ...partida, arriba };

  const otra = partida.cartas[arriba[0]!]!;
  const intentos = partida.intentos + 1;

  if (otra.par === carta.par) {
    return { ...partida, arriba: [], encontradas: [...partida.encontradas, carta.par], intentos };
  }

  return { ...partida, arriba, intentos };
}
