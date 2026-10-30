/**
 * Genera el favicon y los iconos de instalación a partir de `marca/logo.svg`.
 *
 * Uso: `npm run icons`. Se ejecuta a mano y su salida se versiona, igual que el subconjunto
 * de fuentes. No entra en `npm run build` porque el logo cambia una vez cada nunca y no tiene
 * sentido pagarlo en cada despliegue de Netlify.
 *
 * El original vive en `marca/` y no en `public/`, que es la carpeta que Astro copia tal cual a
 * `dist/`. Es una copia de la marca de `src/components/Logo.astro` con los colores en
 * hexadecimal; si cambia uno, hay que cambiar el otro y volver a correr esto.
 *
 * ## Por qué los iconos no se generan todos igual
 *
 * Cada sistema recorta el icono a su manera:
 *
 *  - **`icon-128`, `icon-192` e `icon-512` (`purpose: any`)** conservan la transparencia. Los
 *    usan el escritorio, el conmutador de tareas y el diálogo de instalación de Chrome, y
 *    ninguno recorta nada: con fondo, la marca aparecería metida en una baldosa.
 *  - **`icon-maskable-512`** llena el lienzo de borde a borde, porque es Android quien lo
 *    recorta —en círculo, en `squircle` o en gota, según el fabricante—. La especificación solo
 *    garantiza el círculo central del 80 %, y la marca es ancha (el libro va de lado a lado),
 *    así que va al 64 % para que ninguna máscara le muerda la tapa.
 *  - **`apple-touch-icon`** es opaco y cuadrado. iOS le pone su propia máscara redondeada; lo
 *    que no perdona es el canal alfa, que pinta de negro.
 *  - **`favicon.svg`** es la marca tal cual, para los navegadores que aceptan SVG, y
 *    **`favicon.ico`** el respaldo de 32 px para los que no, y para quien pide `/favicon.ico`
 *    a ciegas.
 *
 * El fondo de los iconos opacos es el papel del sitio: la marca se diseñó sobre papel, y el
 * libro (hojas claras) se perdería sobre un fondo de color.
 */

import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import sharp from 'sharp';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORIGEN = path.join(RAIZ, 'marca', 'logo.svg');
const PUBLICO = path.join(RAIZ, 'public');

/** El papel del sitio, `--color-papel`. */
const PAPEL = { r: 0xff, g: 0xfd, b: 0xf8, alpha: 1 };

/** Fracción del lienzo que ocupa la marca en el icono enmascarable (ver arriba). */
const ESCALA_MASCARA = 0.64;

/** Fracción en el de Apple, que solo redondea las esquinas y deja ver casi todo. */
const ESCALA_APPLE = 0.8;

const PNG = { compressionLevel: 9, palette: true, colours: 64 };

/** El SVG rasterizado con nitidez: `density` escala el lienzo vectorial antes de reducirlo. */
function marca(lado) {
  return sharp(ORIGEN, { density: Math.ceil((lado / 64) * 72 * 2) }).resize(lado, lado);
}

/** Marca a todo el lienzo, con fondo transparente. */
async function iconoSuelto(lado) {
  return marca(lado).png(PNG).toBuffer();
}

/** Marca centrada sobre papel, sin canal alfa. */
async function iconoConFondo(lado, escala) {
  const interior = Math.round(lado * escala);
  const margen = Math.round((lado - interior) / 2);

  return sharp({
    // `channels: 3` es lo que garantiza que no salga canal alfa, que es lo que iOS no perdona.
    create: { width: lado, height: lado, channels: 3, background: PAPEL },
  })
    .composite([{ input: await marca(interior).png().toBuffer(), top: margen, left: margen }])
    .png(PNG)
    .toBuffer();
}

/**
 * Un `.ico` con un único PNG dentro. Es el formato que aceptan todos los navegadores desde
 * Windows Vista: una cabecera de 6 bytes, una entrada de 16 y el PNG tal cual. Así no hace
 * falta otra dependencia para escribir ICO.
 */
function ico(png, lado) {
  const cabecera = Buffer.alloc(6);
  cabecera.writeUInt16LE(0, 0); // reservado
  cabecera.writeUInt16LE(1, 2); // tipo: icono
  cabecera.writeUInt16LE(1, 4); // una imagen

  const entrada = Buffer.alloc(16);
  entrada.writeUInt8(lado, 0);
  entrada.writeUInt8(lado, 1);
  entrada.writeUInt8(0, 2); // sin paleta
  entrada.writeUInt8(0, 3);
  entrada.writeUInt16LE(1, 4); // planos
  entrada.writeUInt16LE(32, 6); // bits por píxel
  entrada.writeUInt32LE(png.length, 8);
  entrada.writeUInt32LE(6 + 16, 12); // el PNG empieza tras cabecera y entrada

  return Buffer.concat([cabecera, entrada, png]);
}

async function main() {
  await mkdir(PUBLICO, { recursive: true });

  const salidas = [
    ['icon-128.png', await iconoSuelto(128)],
    ['icon-192.png', await iconoSuelto(192)],
    ['icon-512.png', await iconoSuelto(512)],
    ['icon-maskable-512.png', await iconoConFondo(512, ESCALA_MASCARA)],
    ['apple-touch-icon.png', await iconoConFondo(180, ESCALA_APPLE)],
    ['favicon.ico', ico(await marca(32).png().toBuffer(), 32)],
  ];

  for (const [nombre, datos] of salidas) {
    await writeFile(path.join(PUBLICO, nombre), datos);
    console.log(`${nombre.padEnd(24)} ${(datos.length / 1024).toFixed(1)} KB`);
  }

  await copyFile(ORIGEN, path.join(PUBLICO, 'favicon.svg'));
  const svg = (await readFile(ORIGEN)).length;
  console.log(`${'favicon.svg'.padEnd(24)} ${(svg / 1024).toFixed(1)} KB`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
