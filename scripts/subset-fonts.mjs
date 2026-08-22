/**
 * Descarga Charis SIL y la recorta a los caracteres que el sitio realmente usa.
 *
 * Charis SIL completa pesa ~752 KB por variante en TTF (~350-400 KB en WOFF2 sin
 * recortar). El presupuesto de carga inicial del proyecto entero es de 150 KB, así que
 * subsetear no es una optimización: es la condición para poder usar esta fuente.
 *
 * Se ejecuta a mano con `npm run fonts`, NO en cada build. Los WOFF2 resultantes se
 * versionan en git, de modo que compilar el sitio no depende de la red ni de que este
 * script se vuelva a ejecutar.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import subsetFont from 'subset-font';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DESTINO = path.join(RAIZ, 'public', 'fonts');
const CACHE = path.join(RAIZ, 'scripts', '.cache-fuentes');

const ORIGEN = 'https://raw.githubusercontent.com/google/fonts/main/ofl/charissil';

const VARIANTES = [
  { archivo: 'CharisSIL-Regular.ttf', salida: 'charis-sil-400.woff2', peso: 400 },
  { archivo: 'CharisSIL-Bold.ttf', salida: 'charis-sil-700.woff2', peso: 700 },
];

/**
 * Los caracteres que se conservan. Todo lo que no esté aquí desaparece de la fuente y
 * el navegador lo resolverá con una tipografía sustituta — que es justo el fallo que
 * este proyecto intenta evitar. Antes de quitar algo de esta lista, pensarlo dos veces.
 */
const CARACTERES = [
  // Alfabeto latino básico. El Mam usa un subconjunto, pero el sitio está escrito en
  // castellano y necesita el alfabeto completo en ambas cajas.
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  'abcdefghijklmnopqrstuvwxyz',
  '0123456789',

  // La letra propia del Mam. Ninguna fuente de sistema la trae, y es la razón por la
  // que este proyecto autoaloja Charis SIL.
  'Ẍẍ', // Ẍ ẍ

  // Diéresis combinante. Imprescindible aunque el dato siempre llegue en NFC: sin ella
  // la prueba de composición de /prueba-tipografica falla por culpa del subset y no del
  // navegador, y cualquier texto que se cuele en NFD se rompe en silencio.
  '̈',

  // Apóstrofos. U+2019 es el canónico del proyecto; los otros dos aparecen en los PDF
  // de origen y se muestran en la página de prueba para poder distinguirlos a simple
  // vista.
  String.fromCodePoint(0x2019, 0x0027, 0x02bc),

  // La corrupción de origen: en los PDF anteriores a Unicode, ẍ quedó codificada como
  // õ. Se conserva el glifo para poder documentar el error visualmente.
  'õÕ', // õ Õ

  // Castellano.
  'áéíóúüñ',
  'ÁÉÍÓÚÜÑ',
  '¿¡',

  // Puntuación y signos de uso corriente.
  ' .,;:!?()[]{}/\|@#%&*+=_~^<>-',
  '«»',
  '“”‘', // “ ” ‘  (’ ya está arriba, como apóstrofo canónico)
  '—–…',
  '° ', // grado y espacio duro
  '→', // usado en los vectores de prueba de la ortografía
].join('');

async function descargar(nombre) {
  await mkdir(CACHE, { recursive: true });
  const local = path.join(CACHE, nombre);

  if (existsSync(local)) {
    return readFile(local);
  }

  const url = `${ORIGEN}/${nombre}`;
  process.stdout.write(`  descargando ${nombre}… `);
  const respuesta = await fetch(url);
  if (!respuesta.ok) {
    throw new Error(`No se pudo descargar ${url} (HTTP ${respuesta.status})`);
  }
  const datos = Buffer.from(await respuesta.arrayBuffer());
  await writeFile(local, datos);
  console.log(`${kb(datos.length)}`);
  return datos;
}

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

async function main() {
  await mkdir(DESTINO, { recursive: true });

  console.log(`Recortando Charis SIL a ${[...new Set(CARACTERES)].length} caracteres.\n`);

  let total = 0;

  for (const variante of VARIANTES) {
    const original = await descargar(variante.archivo);

    // subset-font conserva por defecto todas las funciones de OpenType (equivale a
    // --font-features=*) y hace cierre de layout, así que ccmp/mark/mkmk sobreviven y
    // la diéresis combinante se sigue posicionando bien sobre la x.
    const recortada = await subsetFont(original, CARACTERES, {
      targetFormat: 'woff2',
    });

    await writeFile(path.join(DESTINO, variante.salida), recortada);
    total += recortada.length;

    const reduccion = (100 - (recortada.length / original.length) * 100).toFixed(1);
    console.log(
      `  ${variante.salida.padEnd(22)} ${kb(original.length).padStart(9)} → ` +
        `${kb(recortada.length).padStart(8)}  (−${reduccion} %)`
    );
  }

  // La OFL exige que la licencia acompañe a la fuente, también en las versiones
  // modificadas. Recortar cuenta como modificación.
  const licencia = await descargar('OFL.txt');
  await writeFile(path.join(DESTINO, 'OFL.txt'), licencia);

  console.log(`\n  Total en fuentes: ${kb(total)}`);
  console.log('  WOFF2 ya lleva compresión Brotli interna: este es el peso real de red.');
}

main().catch((error) => {
  console.error(`\nError: ${error.message}`);
  process.exit(1);
});
