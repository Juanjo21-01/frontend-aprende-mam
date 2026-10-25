/**
 * Ingesta del contenido editorial **en tiempo de compilación**: páginas de cultura, gramática y
 * base legal, y los documentos descargables de materiales.
 *
 * Hermano de `vocabulario.ts` y con las mismas reglas —léelo para el porqué—, con una diferencia
 * que es a propósito: **sin `EXPORT_URL` y sin semilla, el contenido sale vacío y el build sigue.**
 * Un vocabulario ausente sí es un fallo (el sitio sin diccionario no es el sitio), pero el
 * contenido editorial todavía no existe hasta que el docente lo escriba y el validador lo
 * revise, y las páginas ya saben cómo decirlo («esta sección todavía no tiene contenido»).
 *
 * Procedencia, en orden:
 *
 *   1. `EXPORT_URL` definida → se consulta el backend. `/version` es compartida con el
 *      vocabulario (es un solo conjunto publicable), así que si coincide con la caché no se
 *      descarga nada. Si el backend falla, **el build revienta**, igual que con el vocabulario.
 *   2. `EXPORT_URL` sin definir → la caché de un build anterior; si no la hay, `docs/contenido.json`
 *      si alguien dejó una exportación real ahí; y si tampoco, contenido vacío.
 *
 * `docs/contenido.ejemplo.json` NO se lee nunca: es el ejemplo del contrato, con textos y
 * enlaces inventados, y leerlo publicaría contenido falso en un sitio para menores. Para ver
 * las páginas con algo dentro en desarrollo, copiarlo a `docs/contenido.json` a mano.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
  contenidoVacio,
  validarContenido,
  type Contenido,
  type Documento,
  type Pagina,
  type Seccion,
} from './contenido-esquema.ts';
import { leerArchivo, pedir, variable } from './vocabulario';

export type { Contenido, Documento, Pagina, Seccion } from './contenido-esquema.ts';

const RAIZ = process.cwd();
const CACHE = path.join(RAIZ, '.cache-datos', 'contenido.json');
const SEMILLA = path.join(RAIZ, 'docs', 'contenido.json');

async function desdeLocal(): Promise<Contenido> {
  const enCache = await leerArchivo(CACHE);

  if (enCache !== null) {
    const contenido = validarContenido(enCache, 'caché local');
    console.log(
      `  contenido: caché de un build anterior, versión ${contenido.version}. ` +
        `Sin EXPORT_URL no se comprueba si hay algo nuevo.`
    );
    return contenido;
  }

  const semilla = await leerArchivo(SEMILLA);

  if (semilla === null) {
    console.log('  contenido: sin caché ni docs/contenido.json; las secciones salen vacías.');
    return contenidoVacio('vacío');
  }

  const contenido = validarContenido(semilla, 'docs/contenido.json');
  console.log(`  contenido: semilla de docs/, versión ${contenido.version}. NO son datos frescos.`);
  return contenido;
}

async function desdeBackend(base: string, token: string | undefined): Promise<Contenido> {
  if (!token) {
    throw new Error('EXPORT_URL está definida pero falta EXPORT_TOKEN (responderá 401).');
  }

  const raiz = base.replace(/\/$/, '');
  const enCache = await leerArchivo(CACHE);
  const remota = (await pedir(`${raiz}/version`, token)) as { version?: unknown };

  if (typeof remota?.version !== 'number') {
    throw new Error(`${raiz}/version no devolvió \`{ version: N }\`.`);
  }

  if (enCache !== null && (enCache as { version?: number }).version === remota.version) {
    console.log(`  contenido: el backend sigue en la versión ${remota.version}; se reutiliza la caché.`);
    return validarContenido(enCache, 'caché local');
  }

  const descargado = await pedir(`${raiz}/contenido.json`, token);
  const contenido = validarContenido(descargado, `${raiz}/contenido.json`);

  await mkdir(path.dirname(CACHE), { recursive: true });
  await writeFile(CACHE, JSON.stringify(descargado), 'utf8');

  console.log(
    `  contenido: descargado del backend, versión ${contenido.version}, ` +
      `${Object.values(contenido.paginas).flat().length} página(s), ` +
      `${contenido.documentos.length} documento(s).`
  );
  return contenido;
}

let pendiente: Promise<Contenido> | null = null;

/** Carga el contenido una sola vez por build; todas las páginas comparten la promesa. */
export function cargarContenido(): Promise<Contenido> {
  pendiente ??= (async () => {
    const base = variable('EXPORT_URL');

    if (!base) return desdeLocal();

    try {
      return await desdeBackend(base, variable('EXPORT_TOKEN'));
    } catch (error) {
      const motivo = error instanceof Error ? error.message : String(error);
      throw new Error(
        `EXPORT_URL apunta a ${base} pero la exportación del contenido falló: ${motivo}\n` +
          `El build se detiene a propósito: publicar con una copia vieja sería publicar ` +
          `contenido desactualizado sin que nadie lo note.`
      );
    }
  })();

  return pendiente;
}

/** Las páginas de una sección, en el orden que fijó el docente. */
export function paginasDe(contenido: Contenido, seccion: Seccion): Pagina[] {
  return [...contenido.paginas[seccion]].sort((a, b) => a.orden - b.orden);
}

/** Los documentos en el orden del docente. */
export function documentosEnOrden(contenido: Contenido): Documento[] {
  return [...contenido.documentos].sort((a, b) => a.orden - b.orden);
}
