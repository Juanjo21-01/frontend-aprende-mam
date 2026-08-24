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

/**
 * Techo del JavaScript de una página, aparte del presupuesto total.
 *
 * Existe porque el total lo dominan las fuentes —37 KB entre las dos variantes— y un
 * crecimiento del JavaScript se escondería debajo durante mucho tiempo.
 *
 * Medido el 23 de agosto de 2026 en la página del diccionario: 50.9 KB son React y
 * react-dom, y 1.6 KB el buscador entero. Es decir, el 97 % de este techo se gasta antes de
 * escribir una línea propia. Los 24 KB que quedan son para las islas del proyecto —los tres
 * juegos y el contenedor de actividades externas—, no para una librería más. Si este número
 * hay que subirlo, la pregunta correcta es qué dependencia entró, no cuánto falta.
 *
 * Las páginas sin isla siguen debiendo salir con cero: se comprueba abajo, por separado.
 */
const PRESUPUESTO_JS = 75 * 1024;

/** Páginas que sí pueden hidratar. El resto del sitio va sin JavaScript, y eso se vigila. */
const CON_ISLA = [/^\/diccionario\/index\.html$/];

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

/**
 * Todos los módulos que el navegador acaba pidiendo a partir de unas raíces.
 *
 * Los fragmentos se importan entre sí con rutas relativas (`from"./react.B3l9tXpq.js"`), así
 * que hay que seguir la cadena: la raíz del buscador pesa 4 KB y arrastra los 180 KB de
 * react-dom. Es un barrido por texto y no un analizador de módulos de verdad, pero sobre la
 * salida de Vite —donde toda importación es un literal— alcanza.
 */
async function cierreDeModulos(raices) {
  const vistos = new Set();
  const pendientes = [...raices];

  while (pendientes.length > 0) {
    const href = pendientes.pop();
    if (!href || vistos.has(href)) continue;
    vistos.add(href);

    let codigo;
    try {
      codigo = await readFile(aArchivo(href), 'utf8');
    } catch {
      // Un módulo que no está en dist/ no lo va a pedir nadie; que lo cace el navegador.
      continue;
    }

    const carpeta = path.posix.dirname(href.split('?')[0]);

    for (const cita of codigo.matchAll(/["'`](\.{1,2}\/[A-Za-z0-9_.\-/]+\.js|\/[A-Za-z0-9_.\-/]+\.js)["'`]/g)) {
      const especificador = cita[1];
      const resuelto = especificador.startsWith('/')
        ? especificador
        : path.posix.normalize(`${carpeta}/${especificador}`);

      if (!vistos.has(resuelto)) pendientes.push(resuelto);
    }
  }

  return vistos;
}

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

  // Las islas de Astro no dejan un `<script src>` en el HTML: dejan un `<astro-island>` con la
  // URL del componente y la del renderizador, y dos scripts en línea que los importan cuando
  // toca. Buscar solo etiquetas `<script src>` da cero y es una cifra falsamente tranquila:
  // los 180 KB de react-dom están detrás de ese atributo.
  const raices = new Set();

  for (const enlace of enlaces) {
    if (!/rel="modulepreload"/i.test(enlace)) continue;
    const href = enlace.match(/href="([^"]+)"/i)?.[1];
    if (href && !href.startsWith('http')) raices.add(href);
  }

  for (const etiqueta of texto.matchAll(/<script\b[^>]*>/gi)) {
    const src = etiqueta[0].match(/src="([^"]+)"/i)?.[1];
    if (src && !src.startsWith('http')) raices.add(src);
  }

  for (const isla of texto.matchAll(/<astro-island\b[^>]*>/gi)) {
    for (const atributo of ['component-url', 'renderer-url']) {
      const href = isla[0].match(new RegExp(`${atributo}="([^"]+)"`, 'i'))?.[1];
      if (href && !href.startsWith('http')) raices.add(href);
    }
  }

  let js = 0;

  // Se cuenta el cierre entero de importaciones, no solo las raíces. Y se cuenta contra la
  // carga inicial aunque `client:visible` lo difiera: el buscador está arriba del todo, así
  // que en cuanto la página pinta ya es visible y el navegador se lo baja igual.
  for (const href of await cierreDeModulos(raices)) {
    const datos = await readFile(aArchivo(href));
    const red = brotli(datos);
    recursos.push({ nombre: href, tipo: 'JS', crudo: datos.length, red, nota: 'brotli · isla' });
    comprimido += red;
    crudo += datos.length;
    js += red;
  }

  const scripts = [...texto.matchAll(/<script\b/gi)].length;

  return { ruta, recursos, comprimido, crudo, scripts, js };
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

  const hidratadas = informes.filter((informe) => informe.js > 0);

  console.log(
    `\nJavaScript en el cliente: ${
      hidratadas.length === 0
        ? `ninguno (${scriptsTotales} etiqueta(s) <script> sin módulo)`
        : hidratadas.map((i) => `${i.ruta} ${kb(i.js)}`).join(', ')
    }`
  );

  let falla = false;

  // Que una isla se cuele en una página que debería ser HTML puro es el fallo más caro y el
  // más fácil de no notar: la página sigue viéndose igual. Por eso la lista es explícita.
  for (const informe of hidratadas) {
    if (CON_ISLA.some((patron) => patron.test(informe.ruta))) continue;
    console.error(`FALLA: ${informe.ruta} manda ${kb(informe.js)} de JavaScript y no debería.`);
    falla = true;
  }

  for (const informe of hidratadas) {
    if (informe.js <= PRESUPUESTO_JS) continue;
    console.error(
      `FALLA: ${informe.ruta} manda ${kb(informe.js)} de JavaScript, sobre el techo de ${kb(PRESUPUESTO_JS)}.`
    );
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
