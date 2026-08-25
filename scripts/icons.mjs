/**
 * Genera los iconos de instalación a partir del emblema de `marca/`.
 *
 * Uso: `npm run icons`. Se ejecuta a mano y su salida se versiona, igual que el subconjunto
 * de fuentes. No entra en `npm run build` porque el logo cambia una vez cada nunca y no tiene
 * sentido pagarlo en cada despliegue de Netlify.
 *
 * Los originales viven en `marca/` y no en `public/`, que es la carpeta que Astro copia tal
 * cual a `dist/`.
 *
 * ## El emblema es redondo y el lienzo es cuadrado
 *
 * Ese choque es el que gobierna todo lo de abajo, y cada sistema lo resuelve de una manera
 * distinta. Por eso los iconos **no** se generan todos igual:
 *
 *  - **`icon-192` y `icon-512` (`purpose: any`)** conservan la transparencia del original. Son
 *    los que usan el escritorio, el conmutador de tareas y el diálogo de instalación de
 *    Chrome, y ninguno de ellos recorta nada: si se les aplana el fondo, el emblema redondo
 *    aparece metido dentro de una baldosa cuadrada de color.
 *  - **`icon-maskable-512`** es justo el contrario: tiene que llenar el lienzo de borde a
 *    borde, porque es Android quien lo recorta —en círculo, en `squircle` o en gota, según el
 *    fabricante—. Aquí la transparencia no vale: dejaría las esquinas en negro o en blanco
 *    según el lanzador.
 *  - **`apple-touch-icon`** es opaco y cuadrado a propósito. iOS le aplica **su propia**
 *    máscara redondeada, así que la forma la pone el sistema; lo que no perdona es el canal
 *    alfa, que pinta de **negro**.
 *
 * ## Por qué el fondo es verde y no crema
 *
 * Los dos iconos que llevan fondo lo llevan del verde del anillo del emblema, no del papel
 * del sitio. Con el fondo crema, el recorte circular de Android deja un aro claro alrededor
 * del aro verde del propio emblema: se ven dos círculos concéntricos y parece un error de
 * montaje. Con el verde, el fondo y el anillo son el mismo color, el borde desaparece y el
 * icono se lee como una sola pieza redonda.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import sharp from 'sharp';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORIGEN = path.join(RAIZ, 'marca', 'icono.png');
const LOGO = path.join(RAIZ, 'marca', 'logo.png');
const PUBLICO = path.join(RAIZ, 'public');

/** El verde del anillo exterior del emblema, muestreado del original. */
const VERDE = { r: 0x03, g: 0x45, b: 0x33, alpha: 1 };

/**
 * Fracción del lienzo que ocupa el emblema en los iconos con fondo.
 *
 * La especificación de `maskable` solo garantiza el 80 % central, pero ese mínimo está pensado
 * para logotipos rectangulares que se recortarían por las esquinas. Este emblema ya es un
 * círculo inscrito, así que la máscara circular —la más agresiva de las que usa Android— cae
 * prácticamente sobre su propio borde. Al 92 % llena el icono sin que ninguna máscara le
 * muerda nada; al 80 % se veía pequeño, flotando en medio del verde.
 */
const ESCALA = 0.92;

const PNG = { compressionLevel: 9, palette: true, colours: 128 };

/** Emblema a todo el lienzo, conservando las esquinas transparentes del original. */
async function iconoSuelto(lado) {
  return sharp(ORIGEN)
    .resize(lado, lado, { fit: 'contain', background: { ...VERDE, alpha: 0 } })
    .png(PNG)
    .toBuffer();
}

/** Emblema sobre fondo verde a sangre, sin canal alfa. */
async function iconoConFondo(lado) {
  const emblema = Math.round(lado * ESCALA);
  const margen = Math.round((lado - emblema) / 2);

  const encogido = await sharp(ORIGEN)
    .resize(emblema, emblema, { fit: 'contain', background: { ...VERDE, alpha: 0 } })
    .toBuffer();

  return sharp({
    // `channels: 3` es lo que garantiza que no salga canal alfa, que es lo que iOS no perdona.
    create: { width: lado, height: lado, channels: 3, background: VERDE },
  })
    .composite([{ input: encogido, top: margen, left: margen }])
    .png(PNG)
    .toBuffer();
}

async function main() {
  await mkdir(PUBLICO, { recursive: true });

  const salidas = [
    ['icon-128.png', await iconoSuelto(128)],
    ['icon-192.png', await iconoSuelto(192)],
    ['icon-512.png', await iconoSuelto(512)],
    ['icon-maskable-512.png', await iconoConFondo(512)],
    ['apple-touch-icon.png', await iconoConFondo(180)],

    // El logo completo, con el texto y la cenefa. Es el del encabezado del sitio, no un icono
    // de instalación: aquí sí se conserva la transparencia, porque va sobre el papel de la
    // página y no dentro de ninguna baldosa.
    [
      'logo.webp',
      await sharp(LOGO)
        .resize(512, 512, {
          fit: 'contain',
          background: { ...VERDE, alpha: 0 },
        })
        .webp({ quality: 82 })
        .toBuffer(),
    ],
  ];

  for (const [nombre, datos] of salidas) {
    await writeFile(path.join(PUBLICO, nombre), datos);
    console.log(`${nombre.padEnd(24)} ${(datos.length / 1024).toFixed(1)} KB`);
  }

  const original = (await readFile(ORIGEN)).length + (await readFile(LOGO)).length;
  const generado = salidas.reduce((total, [, datos]) => total + datos.length, 0);

  console.log(
    `\n${(original / 1024 / 1024).toFixed(2)} MB de originales → ` +
      `${(generado / 1024).toFixed(0)} KB publicados.`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
