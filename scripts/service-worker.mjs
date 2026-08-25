/**
 * Integración de Astro que emite `dist/sw.js` al terminar el build.
 *
 * Es una integración y no un script suelto de `package.json` por un motivo concreto: Netlify
 * ejecuta `npm run build`, no `npm run check`. Cualquier cosa que viva fuera de `astro build`
 * funcionaría en esta computadora y no se desplegaría, y el fallo sería mudo — el sitio se ve
 * igual de bien, simplemente deja de funcionar sin conexión.
 *
 * Lo que hace es poco: recorre `dist/`, arma la lista de lo que hay que precargar, calcula un
 * hash del **contenido** de esa lista y lo inyecta todo en `src/service-worker.js`.
 *
 * El hash es sobre el contenido y no sobre los nombres, y esa distinción importa. Los CSS y JS
 * de `_astro/` ya llevan hash en el nombre, así que ahí bastaría con la lista; pero los HTML
 * no. Corregir una errata en la página de cultura no cambia ningún nombre de archivo, y si el
 * hash saliera de los nombres, la caché conservaría la errata hasta la siguiente publicación
 * que tocara un asset. Leyendo el contenido, cualquier cambio en cualquier archivo precargado
 * produce una caché nueva.
 */

import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PLANTILLA = path.join(RAIZ, 'src', 'service-worker.js');

/**
 * Páginas que se compilan pero no se precargan.
 *
 * `prueba-tipografica` es la prueba de aceptación de la ortografía del Mam: existe para
 * mirarla en un teléfono real y comprobar que la `ẍ` sale con la fuente correcta. No es
 * contenido para nadie más, y guardarla ocuparía la cuota de un usuario que nunca la va a
 * abrir.
 */
const FUERA = [/^\/prueba-tipografica$/];

/**
 * Extensiones que se precargan de `dist/`, aparte del HTML.
 *
 * `.png` y `.webp` **no** están, y no es un olvido: las imágenes van bajo demanda (regla 2 del
 * service worker). Si esto se ampliara, cualquier foto que alguien dejara caer en `public/`
 * entraría en la instalación sin que nadie lo decidiera.
 */
const PRECARGABLES = new Set(['.css', '.js', '.woff2', '.json', '.webmanifest', '.svg']);

/**
 * Excepciones a lo anterior, una por una.
 *
 * Las dos aparecen en todas las páginas, así que sin ellas el sitio sin conexión se ve roto en
 * vez de simplemente desconectado: el navegador enseñaría la hoja en blanco genérica en la
 * pestaña y un hueco donde va el logo del encabezado, justo cuando el usuario está comprobando
 * si la aplicación le sirve sin señal.

 * Van una por una y no por extensión porque las imágenes de contenido sí tienen que ir bajo
 * demanda: esta lista es de recursos de la interfaz, no de contenido.
 */
const EXTRA = ['/favicon.ico', '/logo.webp'];

/**
 * Lo que nunca entra en la precarga aunque tenga una extensión de la lista.
 *
 *  - Los PDF, por la cuota (ver la regla 3 del service worker). No están en `PRECARGABLES`,
 *    pero se deja escrito aquí porque es la decisión que más veces se va a intentar revertir.
 *  - `ping.txt`, porque es justo el archivo que la sonda usa para saber si hay red.
 *  - Los iconos de instalación: los lee el sistema operativo al instalar la aplicación, no la
 *    página. Guardarlos no aporta nada, y además —mientras no existan— haría que la
 *    instalación entera del service worker fallara por un 404, dejando al usuario sin
 *    diccionario sin conexión por culpa de un icono.
 */
const EXCLUIDOS = [/^\/ping\.txt$/, /\.pdf$/, /^\/icon-/, /^\/apple-touch-icon\.png$/];

/** Iconos que el manifiesto declara y que tienen que existir para que se pueda instalar. */
const ICONOS = [
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-512.png',
  'apple-touch-icon.png',
  'favicon.ico',
];

async function archivos(dir, base = dir) {
  const encontrados = [];

  for (const entrada of await readdir(dir, { withFileTypes: true })) {
    const completa = path.join(dir, entrada.name);
    if (entrada.isDirectory()) {
      encontrados.push(...(await archivos(completa, base)));
    } else {
      encontrados.push('/' + path.relative(base, completa).replaceAll(path.sep, '/'));
    }
  }

  return encontrados;
}

/** `/diccionario/letra/a/index.html` → `/diccionario/letra/a`, y `/index.html` → `/`. */
function claveDePagina(archivo) {
  const ruta = archivo.slice(0, -'index.html'.length);
  return ruta.length > 1 ? ruta.replace(/\/$/, '') : '/';
}

export default function serviceWorker({ respaldo = '/sin-conexion', sonda = '/ping.txt' } = {}) {
  return {
    name: 'aprendemam:service-worker',

    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const DIST = fileURLToPath(dir);
        const todos = (await archivos(DIST)).sort();

        const paginas = todos
          .filter((a) => a.endsWith('/index.html'))
          .map((archivo) => [claveDePagina(archivo), archivo])
          .filter(([clave]) => !FUERA.some((patron) => patron.test(clave)));

        const assets = todos.filter(
          (a) =>
            !a.endsWith('.html') &&
            (EXTRA.includes(a) ||
              (PRECARGABLES.has(path.extname(a)) &&
                !EXCLUIDOS.some((patron) => patron.test(a))))
        );

        if (!paginas.some(([clave]) => clave === respaldo)) {
          throw new Error(
            `El service worker necesita la página de respaldo ${respaldo} y no está en dist/.`
          );
        }

        // El hash se calcula en orden alfabético de rutas, que es estable entre máquinas. Si
        // dependiera del orden en que el sistema de archivos devuelve las entradas, dos builds
        // del mismo commit podrían dar hashes distintos y el navegador se descargaría la
        // caché entera sin motivo.
        const huella = createHash('sha256');
        let crudo = 0;

        for (const archivo of [...paginas.map(([, a]) => a), ...assets]) {
          const datos = await readFile(path.join(DIST, archivo));
          huella.update(archivo).update(datos);
          crudo += datos.length;
        }

        const hash = huella.digest('hex').slice(0, 12);

        const plantilla = await readFile(PLANTILLA, 'utf8');

        const sustituciones = {
          __HASH__: hash,
          __PAGINAS__: JSON.stringify(paginas),
          __ASSETS__: JSON.stringify(assets),
          __RESPALDO__: respaldo,
          __SONDA__: sonda,
        };

        let codigo = plantilla;

        for (const [marcador, valor] of Object.entries(sustituciones)) {
          if (!codigo.includes(marcador)) {
            throw new Error(`src/service-worker.js ya no contiene el marcador ${marcador}.`);
          }
          // Los marcadores de texto van entre comillas en la plantilla, así que se sustituye
          // el marcador a secas; los de lista ocupan la expresión entera y también.
          codigo = codigo.replaceAll(marcador, valor);
        }

        await writeFile(path.join(DIST, 'sw.js'), codigo, 'utf8');

        logger.info(
          `sw.js · caché aprendemam-${hash} · ${paginas.length} páginas y ${assets.length} recursos · ` +
            `${(crudo / 1024).toFixed(0)} KB sin comprimir en la instalación`
        );

        // No se rompe el build por esto: el sitio funciona igual y sin conexión también. Lo
        // único que falta es el instalador, y bloquear un despliegue de contenido por un PNG
        // sería peor. Pero tiene que verse en el log de Netlify.
        const faltan = ICONOS.filter((icono) => !todos.includes('/' + icono));

        if (faltan.length > 0) {
          logger.warn(
            `Faltan iconos en public/: ${faltan.join(', ')}. Sin ellos el navegador no ofrece ` +
              '«Instalar aplicación» y la PWA queda a medias.'
          );
        }
      },
    },
  };
}
