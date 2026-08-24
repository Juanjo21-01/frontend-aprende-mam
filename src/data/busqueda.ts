/**
 * Lo que comparten la compilación y el navegador para poder buscar.
 *
 * Este módulo es deliberadamente puro: sin `node:fs`, sin variables de entorno, sin nada que
 * no pueda viajar dentro de una isla. `vocabulario.ts` sí toca el disco y la red, así que no
 * puede importarse desde el cliente; los tipos y el plegado de texto viven aquí para que los
 * dos lados usen exactamente el mismo código.
 */

/** Una entrada tal como viaja al navegador. Los campos opcionales se omiten si son nulos. */
export interface EntradaBuscable {
  id: number;
  /** Ortografía canónica. Se muestra tal cual, nunca se transforma. */
  mam: string;
  espanol: string;
  /** Forma plegada del Mam, calculada por el backend. Contra esto compara el buscador. */
  busqueda: string;
  temas: string[];
  clase?: string;
  definicion?: string;
  municipio?: string;
  /** Índice dentro de `fuentes`. */
  fuente?: number;
  pagina?: number;
}

export interface FuenteBuscable {
  titulo: string;
  institucion: string | null;
  anio: number | null;
}

export interface DatosBusqueda {
  version: number;
  /** Nombre en castellano de cada tema, por slug. */
  temas: Record<string, string>;
  fuentes: FuenteBuscable[];
  entradas: EntradaBuscable[];
}

/** Dónde vive el vocabulario que descarga el buscador. La versión va en el nombre. */
export function rutaDeDatos(version: number): string {
  return `${import.meta.env.BASE_URL}datos/vocabulario-v${version}.json`;
}

const CORRUPCION: Record<string, string> = { õ: 'ẍ', Õ: 'Ẍ' };

/**
 * Pliega un texto igual que `TextNormalizer::searchKey()` del backend.
 *
 * Es una traducción literal de ese método, y tiene que seguir siéndolo: el campo `busqueda`
 * de cada entrada se calculó allá con esas reglas, y aquí se pliega lo que la persona teclea
 * para compararlo. Si las dos versiones se separan, el buscador deja de encontrar palabras
 * que sí existen, sin ningún error a la vista.
 *
 * El orden importa. NFC va primero: si la corrupción llega descompuesta (`o` + U+0303), la
 * sustitución no la vería y el NFC posterior la recompondría a `õ`.
 *
 *   1. NFC.
 *   2. `õ`→`ẍ`, la corrupción tipográfica de los PDF anteriores a Unicode.
 *   3. Los cuatro apóstrofos del corpus a U+2019, y NFC otra vez.
 *   4. Minúsculas, `ẍ`→`x`, fuera el saltillo.
 *   5. Fuera los diacríticos del castellano: descomponer, borrar marcas, componer.
 *
 * Nadie teclea el saltillo ni la diéresis al buscar, y ese es justamente el punto: quien
 * escribe «xiky» encuentra `ẍiky`, y quien escribe «anab» encuentra `anab’`.
 */
export function claveDeBusqueda(texto: string): string {
  const normalizado = texto
    .normalize('NFC')
    .replace(/[õÕ]/g, (letra) => CORRUPCION[letra] ?? letra)
    .replace(/['ʼꞌ]/g, '’')
    .normalize('NFC');

  return normalizado
    .toLowerCase()
    .replace(/ẍ/g, 'x')
    .replace(/’/g, '')
    .normalize('NFD')
    .replace(/\p{Mn}+/gu, '')
    .normalize('NFC');
}

export interface Resultado {
  entrada: EntradaBuscable;
  rango: number;
  posicion: number;
}

export function buscar(datos: DatosBusqueda, plegados: string[], consulta: string): Resultado[] {
  // Se recorta antes de plegar: sin esto, teclear un espacio devuelve las entradas de varias
  // palabras, que es un resultado desconcertante para quien solo rozó la barra espaciadora.
  const clave = claveDeBusqueda(consulta.trim());

  if (clave === '') return [];

  const encontrados: Resultado[] = [];

  for (let i = 0; i < datos.entradas.length; i++) {
    const entrada = datos.entradas[i]!;
    const espanol = plegados[i]!;

    // De la coincidencia más fuerte a la más débil. El primero que acierta manda.
    let rango = -1;

    if (entrada.busqueda === clave) rango = 0;
    else if (entrada.busqueda.startsWith(clave)) rango = 1;
    else if (espanol === clave) rango = 2;
    else if (espanol.startsWith(clave)) rango = 3;
    // Palabra suelta dentro de la traducción: «hombre» encuentra «hermana de hombre».
    else if (espanol.includes(` ${clave}`)) rango = 4;
    else if (entrada.busqueda.includes(clave)) rango = 5;
    else if (espanol.includes(clave)) rango = 6;

    if (rango >= 0) encontrados.push({ entrada, rango, posicion: i });
  }

  // `posicion` desempata: es el orden del alfabeto Mam que ya venía resuelto del backend.
  encontrados.sort((a, b) => a.rango - b.rango || a.posicion - b.posicion);

  return encontrados;
}
