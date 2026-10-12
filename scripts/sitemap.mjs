/**
 * Integración de Astro que emite `dist/sitemap.xml` y `dist/robots.txt` al terminar el build.
 *
 * Está escrita a mano y no con `@astrojs/sitemap` por la regla del proyecto de no sumar
 * dependencias cuando el problema cabe en unas líneas: esto es recorrer `dist/` y escribir dos
 * archivos. Va como integración, igual que el service worker, porque Netlify ejecuta
 * `npm run build` y nada más.
 *
 * Para qué sirve aquí: que un docente que busca «diccionario mam» encuentre las páginas por
 * letra y por tema, no solo la portada. Las URL siguen el mismo formato que la canónica de
 * `BaseLayout` —con barra final—, porque si el sitemap y la canónica no coinciden el buscador
 * las trata como páginas distintas.
 */

import { readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * Páginas que existen pero no son para buscadores:
 *  - `prueba-tipografica`: la prueba de aceptación de la ortografía, para mirarla en un teléfono.
 *  - `sin-conexion`: el respaldo del service worker; solo tiene sentido sin señal.
 * `404.html` no aparece porque no es un `index.html`.
 */
const FUERA = [/^\/prueba-tipografica\/$/, /^\/sin-conexion\/$/];

async function paginas(dir, base = dir) {
  const encontradas = [];

  for (const entrada of await readdir(dir, { withFileTypes: true })) {
    const completa = path.join(dir, entrada.name);
    if (entrada.isDirectory()) {
      encontradas.push(...(await paginas(completa, base)));
    } else if (entrada.name === 'index.html') {
      const relativa = path.relative(base, path.dirname(completa)).replaceAll(path.sep, '/');
      encontradas.push(relativa === '' ? '/' : `/${relativa}/`);
    }
  }

  return encontradas;
}

const escapar = (texto) =>
  texto.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

export default function sitemap() {
  let sitio;

  return {
    name: 'aprendemam:sitemap',

    hooks: {
      'astro:config:done': ({ config }) => {
        sitio = config.site;
      },

      'astro:build:done': async ({ dir, logger }) => {
        if (!sitio) {
          throw new Error(
            'El sitemap necesita `site` en astro.config.mjs para armar URL absolutas.'
          );
        }

        const DIST = fileURLToPath(dir);
        const rutas = (await paginas(DIST))
          .filter((ruta) => !FUERA.some((patron) => patron.test(ruta)))
          .sort();

        // `encodeURI` deja las rutas tal cual salvo lo que no puede viajar en una URL. Hoy todos
        // los slugs son ASCII (`b-glotal`, `x-dieresis`), pero un tema nuevo con tilde no
        // rompería el XML.
        const urls = rutas
          .map((ruta) => `  <url><loc>${escapar(new URL(encodeURI(ruta), sitio).href)}</loc></url>`)
          .join('\n');

        await writeFile(
          path.join(DIST, 'sitemap.xml'),
          `<?xml version="1.0" encoding="UTF-8"?>\n` +
            `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
          'utf8'
        );

        await writeFile(
          path.join(DIST, 'robots.txt'),
          `User-agent: *\nAllow: /\n\nSitemap: ${new URL('sitemap.xml', sitio).href}\n`,
          'utf8'
        );

        logger.info(`sitemap.xml · ${rutas.length} páginas · robots.txt`);
      },
    },
  };
}
