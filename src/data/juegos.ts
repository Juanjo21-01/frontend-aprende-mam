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
    listo: true,
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
  /** Solo las que sirven para ese juego (`aptaPara`). */
  palabras: PalabraDeJuego[];
}

/**
 * Si una palabra sirve para un juego.
 *
 * La sopa de letras deja fuera tres casos: las entradas de varias palabras (un espacio no es
 * una casilla), las que traen una letra que no es del alfabeto Mam —enseñar a buscar una `b`
 * sin saltillo es enseñar una errata— y las que no caben en la cuadrícula más ancha.
 */
export function aptaPara(juego: SlugDeJuego, palabra: PalabraDeJuego): boolean {
  if (juego !== 'sopa-de-letras') return true;

  const letras = grafemasDe(palabra);
  return !letras.includes(' ') && !tieneLetrasAjenas(palabra) && letras.length <= ANCHO_MAXIMO_SOPA;
}

/**
 * Los temas que se pueden jugar a un juego, en el orden del panel. Recibe la salida de
 * `porTema()`. Un tema entra si tiene al menos `MINIMO_POR_TEMA` palabras aptas para ese juego.
 *
 * Revienta si un tema se llama como la ruta de «todos»: las dos páginas caerían en el mismo
 * archivo de `dist/` y una pisaría a la otra sin ningún error.
 */
export function temasJugables(
  grupos: { categoria: Categoria; entradas: Entrada[] }[],
  juego: SlugDeJuego
): TemaJugable[] {
  if (grupos.some(({ categoria }) => categoria.slug === TODOS)) {
    throw new Error(`Hay un tema con el slug «${TODOS}», que es la ruta de la partida mezclada.`);
  }

  return grupos
    .map(({ categoria, entradas }) => ({
      categoria,
      palabras: entradas.map(aPalabraDeJuego).filter((palabra) => aptaPara(juego, palabra)),
    }))
    .filter(({ palabras }) => palabras.length >= MINIMO_POR_TEMA);
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

    const grafema =
      GRAFEMAS[posicion - 1] ?? fallo(`la posición ${posicion} no está en el alfabeto.`);
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
  return grafemasDe(palabra).some(
    (letra) => letra !== ' ' && !alfabeto.has(letra.toLocaleLowerCase('es'))
  );
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

  return {
    palabras: elegidas,
    cartas: barajar(cartas, azar),
    arriba: [],
    encontradas: [],
    intentos: 0,
  };
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
    return {
      ...partida,
      arriba: [],
      encontradas: [...partida.encontradas, carta.par],
      intentos,
    };
  }

  return { ...partida, arriba, intentos };
}

// ────────────────────────────────────────────────────────────────────── Sopa de letras ──

/** Casillas por lado como máximo: 8 de unos 40 px caben en un teléfono de 360 px de ancho. */
export const ANCHO_MAXIMO_SOPA = 8;
const ANCHO_MINIMO_SOPA = 5;
/** Palabras por partida. Más que esto, la lista de pistas empuja la cuadrícula fuera de vista. */
export const PALABRAS_SOPA = 6;

export interface PalabraEnSopa {
  palabra: PalabraDeJuego;
  /** Las letras Mam de la palabra: una por casilla. */
  letras: string[];
}

export interface PartidaSopa {
  lado: number;
  /** Las casillas por filas: `casillas[fila * lado + columna]`. */
  casillas: string[];
  palabras: PalabraEnSopa[];
  /** Índices en `palabras`, en el orden en que se encontraron. */
  encontradas: number[];
  /** Casillas que forman parte de una palabra ya encontrada. */
  marcadas: number[];
  /** Primera casilla tocada de la selección en curso. */
  inicio: number | null;
  /** Casillas del último intento fallido; se ven en rojo hasta el siguiente toque. */
  fallidas: number[];
  intentos: number;
}

/** Las casillas en línea recta entre dos, ambas incluidas; `null` si no están en línea. */
export function casillasEntre(lado: number, desde: number, hasta: number): number[] | null {
  const [f1, c1] = [Math.floor(desde / lado), desde % lado];
  const [f2, c2] = [Math.floor(hasta / lado), hasta % lado];

  if (f1 !== f2 && c1 !== c2) return null;

  const paso = f1 === f2 ? Math.sign(c2 - c1) : Math.sign(f2 - f1) * lado;
  const casillas = [desde];

  for (let actual = desde; actual !== hasta;) {
    actual += paso;
    casillas.push(actual);
  }

  return casillas;
}

/**
 * Intenta colocar las palabras: solo de izquierda a derecha o de arriba abajo, nunca al revés
 * ni en diagonal. Dos palabras pueden cruzarse si comparten la letra del cruce. Devuelve las
 * que entraron; las que no cupieron se quedan fuera de la partida.
 */
function colocar(
  lado: number,
  palabras: PalabraEnSopa[],
  azar: Azar
): { casillas: (string | null)[]; colocadas: PalabraEnSopa[] } {
  const casillas: (string | null)[] = Array.from({ length: lado * lado }, () => null);
  const colocadas: PalabraEnSopa[] = [];

  // Las largas primero: son las que menos huecos tienen.
  const porLargo = [...palabras].sort((a, b) => b.letras.length - a.letras.length);

  for (const entrada of porLargo) {
    const largo = entrada.letras.length;

    for (let intento = 0; intento < 200; intento++) {
      const horizontal = azar() < 0.5;
      const fila = Math.floor(azar() * (horizontal ? lado : lado - largo + 1));
      const columna = Math.floor(azar() * (horizontal ? lado - largo + 1 : lado));
      const paso = horizontal ? 1 : lado;
      const origen = fila * lado + columna;

      const cabe = entrada.letras.every((letra, i) => {
        const ocupada = casillas[origen + i * paso];
        return ocupada === null || ocupada === letra;
      });

      if (!cabe) continue;

      entrada.letras.forEach((letra, i) => (casillas[origen + i * paso] = letra));
      colocadas.push(entrada);
      break;
    }
  }

  return { casillas, colocadas };
}

export function nuevaPartidaSopa(
  palabras: readonly PalabraDeJuego[],
  azar: Azar = Math.random,
  cuantas: number = PALABRAS_SOPA
): PartidaSopa {
  const aptas = palabras.filter((palabra) => aptaPara('sopa-de-letras', palabra));
  const elegidas = elegirDistintas(aptas, cuantas, azar).map((palabra) => ({
    palabra,
    letras: grafemasDe(palabra).map((letra) => letra.toLocaleLowerCase('es')),
  }));

  const letrasTotales = elegidas.reduce((suma, { letras }) => suma + letras.length, 0);
  const masLarga = Math.max(0, ...elegidas.map(({ letras }) => letras.length));
  const lado = Math.min(
    ANCHO_MAXIMO_SOPA,
    Math.max(ANCHO_MINIMO_SOPA, masLarga, Math.ceil(Math.sqrt(letrasTotales * 1.6)))
  );

  // Varias tiradas y se queda la que coloca más palabras. Con temas de cuatro palabras, perder
  // una por mala suerte deja la partida a medias.
  let mejor = colocar(lado, elegidas, azar);
  for (let tirada = 0; tirada < 30 && mejor.colocadas.length < elegidas.length; tirada++) {
    const otra = colocar(lado, elegidas, azar);
    if (otra.colocadas.length > mejor.colocadas.length) mejor = otra;
  }

  // El relleno sale de las letras de las propias palabras: con letras al azar de todo el
  // alfabeto, una `ẍ` o un `tx’` sueltos delatarían dónde está cada palabra.
  const relleno = mejor.colocadas.flatMap(({ letras }) => letras);
  const casillas = mejor.casillas.map(
    (letra) => letra ?? relleno[Math.floor(azar() * relleno.length)] ?? 'a'
  );

  // Las pistas en el orden de la partida original, no en el de colocación por largo.
  const enJuego = elegidas.filter((entrada) => mejor.colocadas.includes(entrada));

  return {
    lado,
    casillas,
    palabras: enJuego,
    encontradas: [],
    marcadas: [],
    inicio: null,
    fallidas: [],
    intentos: 0,
  };
}

export function sopaTerminada(partida: PartidaSopa): boolean {
  return partida.palabras.length > 0 && partida.encontradas.length === partida.palabras.length;
}

/**
 * Tocar una casilla. La primera marca el inicio; la segunda cierra la selección y se comprueba.
 *
 * - Tocar otra vez la casilla de inicio la suelta.
 * - Si la segunda no está en línea con la primera, pasa a ser el nuevo inicio: el niño cambió
 *   de idea, no se equivocó, y no cuenta como intento.
 * - Se acepta la selección en cualquier sentido —primera letra y luego última, o al revés—
 *   y se compara por letras, no por posición: si una palabra quedó escrita dos veces por
 *   casualidad, cualquiera de las dos vale.
 */
export function tocarCasilla(partida: PartidaSopa, casilla: number): PartidaSopa {
  if (casilla < 0 || casilla >= partida.casillas.length) return partida;

  const limpia = { ...partida, fallidas: [] };

  if (partida.inicio === null) return { ...limpia, inicio: casilla };
  if (partida.inicio === casilla) return { ...limpia, inicio: null };

  const tramo = casillasEntre(partida.lado, partida.inicio, casilla);
  if (tramo === null) return { ...limpia, inicio: casilla };

  const leido = tramo.map((i) => partida.casillas[i]).join('|');
  const alReves = [...tramo]
    .reverse()
    .map((i) => partida.casillas[i])
    .join('|');
  const intentos = partida.intentos + 1;

  const hallada = partida.palabras.findIndex(
    ({ letras }, i) =>
      !partida.encontradas.includes(i) &&
      (letras.join('|') === leido || letras.join('|') === alReves)
  );

  if (hallada === -1) return { ...limpia, inicio: null, fallidas: tramo, intentos };

  return {
    ...limpia,
    inicio: null,
    intentos,
    encontradas: [...partida.encontradas, hallada],
    marcadas: [...new Set([...partida.marcadas, ...tramo])],
  };
}
