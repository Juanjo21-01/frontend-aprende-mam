/**
 * Busca espacios perdidos alrededor de elementos en línea en el HTML compilado.
 *
 * En Astro, un salto de línea justo antes o después de un elemento en línea se **traga**
 * el espacio en vez de colapsarlo a uno. Es decir, esto:
 *
 *     ...como aparece en
 *     <code>CLAUDE.md</code>
 *
 * produce `aparece en<code>CLAUDE.md</code>`, sin espacio. La solución es `{' '}` explícito
 * al final de la línea, o dejar el elemento en la misma línea que el texto.
 *
 * Importa en este proyecto porque cada página de contenido va a mezclar prosa en castellano
 * con `<span lang="mam">` en línea, y el fallo es invisible hasta que alguien lee el texto
 * renderizado: en el editor el marcado se ve perfectamente bien.
 *
 * Uso: `npm run check:html` (después de `npm run build`).
 */

import { readdir, readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(RAIZ, 'dist');

const LETRA = 'A-Za-z0-9áéíóúüñÁÉÍÓÚÜÑ';
const INLINE = '(?:span|code|a|em|strong|abbr|b|i)';

const ANTES = new RegExp(`[${LETRA},.;:)]<${INLINE}[ >]`, 'g');
const DESPUES = new RegExp(`</${INLINE}>[${LETRA}¿¡]`, 'g');

/**
 * Uniones deliberadas: texto y elemento pegados a propósito. Cada excepción va con su
 * motivo, para que nadie la amplíe por costumbre.
 */
const PERMITIDAS = [
  // El logotipo: «AprendeMam» es una sola palabra, partida en dos para colorear la mitad.
  // El color cambió de tinta a oro con el rediseño; el patrón va pegado al marcado de
  // SiteHeader.astro y hay que actualizarlo en el mismo commit que él, o esta comprobación
  // falla con un falso positivo que no dice nada de lo que pasó.
  /Aprende<span class="text-oro">Mam<\/span>/,
  // La fachada del video: «Ver el video» seguido del título solo para lectores de pantalla, que
  // lo oyen como «Ver el video: Título». Va pegado a propósito, con los dos puntos dentro.
  /(?:Ver el video|Abrir la actividad)<span class="sr-only">: /,
];

async function paginas(dir = DIST) {
  const encontradas = [];
  for (const entrada of await readdir(dir, { withFileTypes: true })) {
    const completa = path.join(dir, entrada.name);
    if (entrada.isDirectory()) encontradas.push(...(await paginas(completa)));
    else if (entrada.name.endsWith('.html')) encontradas.push(completa);
  }
  return encontradas;
}

async function main() {
  try {
    await stat(DIST);
  } catch {
    console.error('No existe dist/. Ejecuta `npm run build` primero.');
    process.exit(1);
  }

  let total = 0;

  for (const archivo of (await paginas()).sort()) {
    const html = await readFile(archivo, 'utf8');
    const ruta = '/' + path.relative(DIST, archivo).replaceAll(path.sep, '/');
    const hallazgos = [];

    for (const patron of [ANTES, DESPUES]) {
      patron.lastIndex = 0;
      let m;
      while ((m = patron.exec(html))) {
        const contexto = html.slice(Math.max(0, m.index - 45), m.index + m[0].length + 30);
        if (PERMITIDAS.some((p) => p.test(contexto))) continue;
        hallazgos.push(contexto.replace(/\s+/g, ' '));
      }
    }

    if (hallazgos.length) {
      console.error(`\n${ruta}`);
      for (const h of hallazgos) console.error(`  … ${h} …`);
      total += hallazgos.length;
    }
  }

  if (total > 0) {
    console.error(
      `\n${total} espacio(s) perdido(s) junto a elementos en línea.\n` +
        `Corregir con {' '} al final de la línea, o poniendo el elemento en la misma línea.`
    );
    process.exit(1);
  }

  console.log('Sin espacios perdidos junto a elementos en línea.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
