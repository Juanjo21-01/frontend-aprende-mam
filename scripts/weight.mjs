/**
 * Mide el peso comprimido de la carga inicial de cada página compilada.
 *
 * El presupuesto del proyecto es de 150 KB comprimidos, y es la métrica de éxito: los
 * usuarios están en teléfonos de gama baja con 3G. Este script existe para que ese número
 * se pueda comprobar en cualquier momento en vez de suponerlo.
 *
 * Dos decisiones de medición que cambian el resultado:
 *
 *  - WOFF2 se cuenta en bytes crudos. Ya lleva compresión Brotli interna y ningún
 *    servidor lo vuelve a comprimir; pasarlo por gzip daría una cifra falsamente
 *    optimista de algo que por la red viaja tal cual.
 *  - Brotli va a calidad 11, que es lo que se consigue precomprimiendo los archivos en el
 *    despliegue. Un servidor que comprima al vuelo usará una calidad menor y los números
 *    de HTML y CSS subirán algo.
 */

import { readdir, readFile, stat } from 'node:fs/promises';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(RAIZ, 'dist');

const PRESUPUESTO = 150 * 1024;

const brotli = (buffer) =>
  brotliCompressSync(buffer, {
    params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
  }).length;

const gzip = (buffer) => gzipSync(buffer, { level: 9 }).length;

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

async function paginas(dir = DIST) {
  const encontradas = [];
  for (const entrada of await readdir(dir, { withFileTypes: true })) {
    const completa = path.join(dir, entrada.name);
    if (entrada.isDirectory()) {
      encontradas.push(...(await paginas(completa)));
    } else if (entrada.name.endsWith('.html')) {
      encontradas.push(completa);
    }
  }
  return encontradas;
}

/** Resuelve una URL absoluta del sitio a su archivo dentro de dist/. */
const aArchivo = (href) => path.join(DIST, href.split('?')[0].replace(/^\//, ''));

async function analizar(archivoHtml) {
  const html = await readFile(archivoHtml);
  const texto = html.toString('utf8');

  const recursos = [];
  let comprimido = brotli(html);
  let crudo = html.length;

  const ruta = '/' + path.relative(DIST, archivoHtml).replaceAll(path.sep, '/');

  recursos.push({
    nombre: ruta,
    tipo: 'HTML',
    crudo: html.length,
    red: brotli(html),
    nota: 'brotli',
  });

  // Hojas de estilo enlazadas. Las que Astro decide incorporar al HTML ya están contadas
  // dentro del documento.
  const enlaces = [...texto.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]);

  for (const enlace of enlaces) {
    const href = enlace.match(/href="([^"]+)"/i)?.[1];
    if (!href || href.startsWith('http')) continue;

    if (/rel="stylesheet"/i.test(enlace)) {
      const datos = await readFile(aArchivo(href));
      const red = brotli(datos);
      recursos.push({ nombre: href, tipo: 'CSS', crudo: datos.length, red, nota: 'brotli' });
      comprimido += red;
      crudo += datos.length;
    }

    if (/rel="preload"/i.test(enlace) && /as="font"/i.test(enlace)) {
      const datos = await readFile(aArchivo(href));
      recursos.push({
        nombre: href,
        tipo: 'FUENTE',
        crudo: datos.length,
        red: datos.length,
        nota: 'woff2 crudo',
      });
      comprimido += datos.length;
      crudo += datos.length;
    }
  }

  const scripts = [...texto.matchAll(/<script\b/gi)].length;

  return { ruta, recursos, comprimido, crudo, scripts };
}

async function main() {
  try {
    await stat(DIST);
  } catch {
    console.error('No existe dist/. Ejecuta `npm run build` primero.');
    process.exit(1);
  }

  const rutas = (await paginas()).sort();
  const informes = [];
  let scriptsTotales = 0;

  for (const archivo of rutas) {
    const informe = await analizar(archivo);
    informes.push(informe);
    scriptsTotales += informe.scripts;
  }

  for (const { ruta, recursos, comprimido, crudo } of informes) {
    console.log(`\n${ruta}`);
    console.log('  ' + '─'.repeat(74));
    for (const r of recursos) {
      console.log(
        `  ${r.tipo.padEnd(7)} ${r.nombre.padEnd(38).slice(0, 38)} ` +
          `${kb(r.crudo).padStart(9)} → ${kb(r.red).padStart(9)}  ${r.nota}`
      );
    }
    const porcentaje = ((comprimido / PRESUPUESTO) * 100).toFixed(0);
    console.log('  ' + '─'.repeat(74));
    console.log(
      `  ${'CARGA INICIAL'.padEnd(46)} ${kb(crudo).padStart(9)} → ` +
        `${kb(comprimido).padStart(9)}  ${porcentaje} % del presupuesto`
    );
  }

  const peor = informes.reduce((a, b) => (b.comprimido > a.comprimido ? b : a));

  console.log(`\n${'═'.repeat(78)}`);
  console.log(`Presupuesto: ${kb(PRESUPUESTO)} comprimidos por carga inicial.`);
  console.log(`Página más pesada: ${peor.ruta} con ${kb(peor.comprimido)}.`);
  console.log(`Margen restante: ${kb(PRESUPUESTO - peor.comprimido)}.`);

  // Referencia de gzip: hay servidores que no ofrecen brotli.
  const soloTexto = peor.recursos.filter((r) => r.tipo !== 'FUENTE');
  if (soloTexto.length) {
    const conGzip = await Promise.all(
      peor.recursos.map(async (r) =>
        r.tipo === 'FUENTE'
          ? r.crudo
          : gzip(await readFile(r.tipo === 'HTML' ? path.join(DIST, r.nombre.replace(/^\//, '')) : aArchivo(r.nombre)))
      )
    );
    const total = conGzip.reduce((a, b) => a + b, 0);
    console.log(`Con gzip en vez de brotli: ${kb(total)}.`);
  }

  console.log(`\nJavaScript en el cliente: ${scriptsTotales === 0 ? 'ninguno' : `${scriptsTotales} etiqueta(s) <script>`}`);

  let falla = false;

  if (scriptsTotales > 0) {
    console.error('FALLA: esta fase del proyecto no debe emitir JavaScript al cliente.');
    falla = true;
  }

  if (peor.comprimido > PRESUPUESTO) {
    console.error(`FALLA: ${peor.ruta} supera el presupuesto de ${kb(PRESUPUESTO)}.`);
    falla = true;
  }

  process.exit(falla ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
