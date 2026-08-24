/**
 * El alfabeto Mam: 32 grafemas en orden de intercalación.
 *
 * Esta tabla **no decide el orden de nada**. El orden ya viene resuelto en el campo `orden`
 * de la exportación, calculado por el tokenizador del backend, que es quien sabe que `ky` es
 * un grafema y no una `k` seguida de una `y`. Aquí solo sirve para dos cosas:
 *
 *   1. Rotular cada grupo alfabético: «entradas que empiezan con tx’».
 *   2. Construir la URL de esa página.
 *
 * La fuente de verdad es `database/seeders/GrafemasSeeder.php` del backend, donde el catálogo
 * vive en la tabla `grafemas` precisamente para que un ajuste ratificado por COLIMAM no
 * obligue a tocar código. Copiarlo aquí es una duplicación consciente: la exportación no
 * incluye el alfabeto y el sitio necesita nombrar los grupos. Para que la copia no envejezca
 * en silencio, la validación de `vocabulario.ts` comprueba en cada build que toda posición que
 * llega en las claves `orden` exista en esta tabla, y revienta el build si aparece una
 * desconocida.
 *
 * Dos caracteres de este archivo se corrompen sin dejar rastro visible:
 *   - `ẍ` es U+1E8D (x con diéresis). Si aparece `õ`, el archivo está roto.
 *   - El saltillo es U+2019 (comilla tipográfica derecha), NO el U+0027 del teclado.
 * `verificarIntegridad()` lo comprueba al cargar el módulo, es decir, en cada build.
 */

/** Grafemas en orden de intercalación. El índice del arreglo más uno es la posición. */
export const GRAFEMAS = [
  'a',
  'b’',
  'ch',
  'ch’',
  'e',
  'i',
  'j',
  'k',
  'k’',
  'ky',
  'ky’',
  'l',
  'm',
  'n',
  'o',
  'p',
  'q',
  'q’',
  'r',
  's',
  't',
  't’',
  'tx',
  'tx’',
  'tz',
  'tz’',
  'u',
  'w',
  'x',
  'ẍ',
  'y',
  '’',
] as const;

export type Grafema = (typeof GRAFEMAS)[number];

/**
 * URL legible para cada grafema.
 *
 * El apóstrofo y la diéresis no pueden viajar tal cual en una ruta: obligarían a codificar el
 * carácter (`/letra/b%E2%80%99`), que es ilegible en la barra de direcciones e invita a que
 * alguien lo reescriba con el apóstrofo del teclado y rompa el enlace. La regla es explícita y
 * en castellano, porque quien lea la URL lee castellano:
 *
 *   b’  → b-glotal        ẍ → x-dieresis        ’ → saltillo
 *
 * El grafema real siempre se muestra en pantalla; el slug solo existe en la ruta.
 */
export function slugDeGrafema(grafema: string): string {
  if (grafema === '’') return 'saltillo';

  return grafema.replace('ẍ', 'x-dieresis').replace('’', '-glotal');
}

/** Posición (1–32) de un grafema, o `undefined` si no pertenece al alfabeto. */
export function posicionDeGrafema(grafema: string): number | undefined {
  const indice = (GRAFEMAS as readonly string[]).indexOf(grafema);
  return indice === -1 ? undefined : indice + 1;
}

/** Grafema de una posición (1–32), o `undefined` si la posición no existe. */
export function grafemaEnPosicion(posicion: number): string | undefined {
  return GRAFEMAS[posicion - 1];
}

/**
 * Posición del primer grafema de una clave `orden`.
 *
 * La clave son dos dígitos por grafema: `tx’otx’` es `24 15 24` → `241524`. El `00` marca el
 * espacio en las entradas de varias palabras (`tlamel ja` → `21 12 01 13 05 12 00 07 01`),
 * así que nunca aparece al principio.
 *
 * Se lee la clave y no la palabra a propósito: deducir el primer grafema de `mam` obligaría a
 * decidir en el navegador si `tx’otx’` empieza con `t`, `tx` o `tx’`, que es exactamente el
 * trabajo que el tokenizador del backend ya hizo.
 */
export function posicionInicial(orden: string): number {
  return Number.parseInt(orden.slice(0, 2), 10);
}

function verificarIntegridad(): void {
  if (GRAFEMAS.length !== 32) {
    throw new Error(`El alfabeto Mam tiene 32 grafemas; esta tabla trae ${GRAFEMAS.length}.`);
  }

  const juntos = GRAFEMAS.join('');

  if (juntos.includes('õ')) {
    throw new Error('`õ` no existe en el alfabeto Mam: el archivo llegó corrupto.');
  }

  if (!(GRAFEMAS as readonly string[]).includes('ẍ')) {
    throw new Error('Falta `ẍ` (U+1E8D) en la posición 30.');
  }

  for (const apostrofo of ["'", 'ʼ', 'ꞌ']) {
    if (juntos.includes(apostrofo)) {
      const punto = apostrofo.codePointAt(0)!.toString(16).toUpperCase();
      throw new Error(`Apóstrofo no canónico (U+${punto}) en la tabla; el único válido es U+2019.`);
    }
  }

  const slugs = GRAFEMAS.map(slugDeGrafema);
  const repetidos = slugs.filter((slug, i) => slugs.indexOf(slug) !== i);

  if (repetidos.length > 0) {
    // Dos grafemas con la misma URL harían que una página alfabética pisara a la otra en
    // dist/ y la mitad de las entradas desapareciera sin ningún error.
    throw new Error(`Slugs repetidos en el alfabeto: ${[...new Set(repetidos)].join(', ')}.`);
  }
}

verificarIntegridad();
