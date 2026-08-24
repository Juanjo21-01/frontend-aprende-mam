/**
 * Ingesta del vocabulario **en tiempo de compilación**.
 *
 * Este módulo solo corre en Node, durante `astro build`. Nada de lo que hay aquí llega al
 * navegador: el sitio se compila a estático y no hace una sola llamada a Laravel en tiempo de
 * ejecución. Si algún día aparece un `fetch` a la API dentro de una isla, es un error de
 * diseño, no una optimización pendiente.
 *
 * Procedencia de los datos, en orden:
 *
 *   1. `EXPORT_URL` definida → se consulta el backend. Primero `/version`, que es una
 *      respuesta de veinte bytes: si coincide con lo que ya hay en caché, no se descarga el
 *      vocabulario entero. Con seis mil entradas eso ahorra el grueso del build.
 *   2. `EXPORT_URL` definida pero el backend falla → **el build revienta**. Definir la
 *      variable es declarar la intención de publicar datos frescos; degradar en silencio a
 *      una copia de agosto sería publicar un diccionario viejo sin que nadie se entere.
 *   3. `EXPORT_URL` sin definir → copia local. Primero la caché de un build anterior, y si no
 *      la hay, la exportación verificada de `docs/vocabulario.json`. Es el camino del
 *      desarrollo sin backend levantado, y avisa por consola de que los datos no son frescos.
 *
 * En Netlify basta con configurar `EXPORT_URL` y `EXPORT_TOKEN` para pasar del caso 3 al 1.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

import { GRAFEMAS, grafemaEnPosicion, posicionInicial, slugDeGrafema } from './alfabeto';

export interface Fuente {
  titulo: string;
  institucion: string | null;
  anio: number | null;
  pagina: number | null;
}

export interface Entrada {
  id: number;
  /** Ortografía canónica. Se muestra tal cual: nunca se transforma en el cliente. */
  mam: string;
  espanol: string;
  definicion: string | null;
  /** Forma plegada contra la que compara el buscador: minúsculas, sin apóstrofos, `ẍ`→`x`. */
  busqueda: string;
  /** Clave de intercalación ya calculada, dos dígitos por grafema. */
  orden: string;
  /** Abreviatura de la categoría gramatical: `s.`, `adj.`, `num.`… */
  clase: string | null;
  municipio: string | null;
  /** Slugs que se resuelven contra `categorias`. */
  temas: string[];
  fuente: Fuente | null;
}

export interface Categoria {
  slug: string;
  nombre_es: string;
  nombre_mam: string | null;
  icono: string | null;
  orden: number;
  padre: number | null;
}

export interface Vocabulario {
  version: number;
  generado_en: string;
  categorias: Categoria[];
  entradas: Entrada[];
  /** De dónde salieron los datos de este build. Se imprime en el log, no en el sitio. */
  procedencia: string;
}

const RAIZ = process.cwd();
const CACHE = path.join(RAIZ, '.cache-datos', 'vocabulario.json');
const SEMILLA = path.join(RAIZ, 'docs', 'vocabulario.json');

/**
 * Astro carga los `.env` en `import.meta.env`, mientras que Netlify inyecta sus variables en
 * `process.env`. Leer de los dos evita que la misma configuración funcione en local y no en el
 * despliegue, que es un fallo difícil de diagnosticar desde el log de Netlify.
 */
function variable(nombre: string): string | undefined {
  const deAstro = (import.meta.env as Record<string, string | undefined>)[nombre];
  return deAstro ?? process.env[nombre];
}

async function leerArchivo(archivo: string): Promise<unknown | null> {
  try {
    return JSON.parse(await readFile(archivo, 'utf8'));
  } catch {
    return null;
  }
}

async function pedir(url: string, token: string | undefined): Promise<unknown> {
  const respuesta = await fetch(url, {
    headers: {
      // `VerifyExportToken` lee `bearerToken()`: el token va en Authorization, no en una
      // cabecera propia.
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      Accept: 'application/json',
    },
    // Un cPanel compartido generando seis mil entradas no responde en dos segundos, pero
    // tampoco puede colgar el build indefinidamente.
    signal: AbortSignal.timeout(30_000),
  });

  if (!respuesta.ok) {
    throw new Error(`HTTP ${respuesta.status} ${respuesta.statusText} en ${url}`);
  }

  return respuesta.json();
}

/**
 * Comprueba que lo que llegó es el contrato y no otra cosa.
 *
 * Existe por un accidente real: el archivo que estuvo en `docs/` al principio era la respuesta
 * paginada del CRUD del panel (`{data, links, meta}`) guardada con el nombre del endpoint de
 * exportación. Casi todos los nombres de campo difieren —`data`/`entradas`,
 * `orden_alfabetico`/`orden`, `categoria_gramatical`/`clase`— así que confundirlos da código
 * que compila y falla en el primer build real.
 */
function validar(datos: unknown, procedencia: string): Vocabulario {
  const fallo = (mensaje: string): never => {
    throw new Error(`Vocabulario inválido (${procedencia}): ${mensaje}`);
  };

  if (typeof datos !== 'object' || datos === null) fallo('la raíz no es un objeto.');

  const raiz = datos as Record<string, unknown>;

  if ('data' in raiz && !('entradas' in raiz)) {
    fallo(
      'trae `data` y no `entradas`: esto es la respuesta paginada del panel ' +
        '(`/api/v1/admin/entradas`), no la exportación del sitio público.'
    );
  }

  if (typeof raiz.version !== 'number') fallo('falta `version` o no es un número.');
  if (typeof raiz.generado_en !== 'string') fallo('falta `generado_en`.');
  if (!Array.isArray(raiz.categorias)) fallo('falta el arreglo `categorias`.');
  if (!Array.isArray(raiz.entradas)) fallo('falta el arreglo `entradas`.');

  const categorias = raiz.categorias as Categoria[];
  const entradas = raiz.entradas as Entrada[];
  const slugsConocidos = new Set(categorias.map((categoria) => categoria.slug));

  let anterior: Entrada | null = null;

  for (const entrada of entradas) {
    const cual = `entrada ${entrada?.id ?? '¿?'} (${entrada?.mam ?? '¿?'})`;

    if (typeof entrada.mam !== 'string' || entrada.mam === '') fallo(`${cual}: \`mam\` vacío.`);
    if (typeof entrada.busqueda !== 'string') fallo(`${cual}: falta \`busqueda\`.`);
    if (typeof entrada.orden !== 'string' || !/^\d+$/.test(entrada.orden)) {
      fallo(`${cual}: \`orden\` no es una clave de dígitos.`);
    }

    // La tabla de grafemas de `alfabeto.ts` es una copia del catálogo del backend. Si allá se
    // resiembra con otro inventario, las posiciones dejan de coincidir y los grupos
    // alfabéticos saldrían rotulados con la letra equivocada. Mejor reventar aquí.
    const posicion = posicionInicial(entrada.orden);
    if (grafemaEnPosicion(posicion) === undefined) {
      fallo(
        `${cual}: la clave \`orden\` empieza en la posición ${posicion}, que no existe en el ` +
          `alfabeto de 32 grafemas de src/data/alfabeto.ts. ` +
          `Si el catálogo \`grafemas\` del backend cambió, hay que actualizar esa tabla.`
      );
    }

    for (const tema of entrada.temas ?? []) {
      if (!slugsConocidos.has(tema)) fallo(`${cual}: el tema «${tema}» no está en \`categorias\`.`);
    }

    // El backend exporta con `enOrdenMam()`. Que llegue desordenado significa que esa consulta
    // se rompió, y el sitio no puede taparlo reordenando: el orden del Mam no es el del
    // castellano y `localeCompare` daría un resultado plausible y equivocado.
    if (anterior !== null && entrada.orden < anterior.orden) {
      fallo(
        `las entradas no vienen en orden: «${anterior.mam}» (${anterior.orden}) precede a ` +
          `«${entrada.mam}» (${entrada.orden}).`
      );
    }

    anterior = entrada;
  }

  const conPadre = categorias.filter((categoria) => categoria.padre !== null);
  if (conPadre.length > 0) {
    // La exportación da `padre` como id numérico pero identifica las categorías por `slug`, y
    // no incluye el id. Con eso la jerarquía no se puede reconstruir en el sitio. Mientras
    // todas las categorías sean de primer nivel da igual; en cuanto aparezca una anidada, hay
    // que pedirle al backend que exporte `padre` como slug.
    console.warn(
      `  aviso: ${conPadre.length} categoría(s) traen \`padre\` como id numérico, que la ` +
        `exportación no permite resolver. Se tratan como categorías de primer nivel.`
    );
  }

  return {
    version: raiz.version as number,
    generado_en: raiz.generado_en as string,
    categorias,
    entradas,
    procedencia,
  };
}

async function desdeLocal(): Promise<Vocabulario> {
  const enCache = await leerArchivo(CACHE);

  if (enCache !== null) {
    const vocabulario = validar(enCache, 'caché local');
    console.log(
      `  vocabulario: caché de un build anterior, versión ${vocabulario.version}, ` +
        `${vocabulario.entradas.length} entrada(s). Sin EXPORT_URL no se comprueba si hay algo nuevo.`
    );
    return vocabulario;
  }

  const semilla = await leerArchivo(SEMILLA);

  if (semilla === null) {
    throw new Error(
      `No hay de dónde sacar el vocabulario: ni caché en ${CACHE} ni semilla en ${SEMILLA}. ` +
        `Definir EXPORT_URL para leerlo del backend.`
    );
  }

  const vocabulario = validar(semilla, 'docs/vocabulario.json');
  console.log(
    `  vocabulario: semilla de docs/, versión ${vocabulario.version}, ` +
      `${vocabulario.entradas.length} entrada(s). NO son datos frescos.`
  );
  return vocabulario;
}

async function desdeBackend(base: string, token: string | undefined): Promise<Vocabulario> {
  if (!token) {
    throw new Error(
      'EXPORT_URL está definida pero falta EXPORT_TOKEN. El endpoint de exportación va ' +
        'protegido con token estático y responderá 401.'
    );
  }

  const raiz = base.replace(/\/$/, '');
  const enCache = await leerArchivo(CACHE);

  // El endpoint de versión existe justamente para esto: saber si hay algo nuevo sin
  // descargar el conjunto entero.
  const remota = (await pedir(`${raiz}/version`, token)) as { version?: unknown };

  if (typeof remota?.version !== 'number') {
    throw new Error(`${raiz}/version no devolvió \`{ version: N }\`.`);
  }

  if (enCache !== null && (enCache as { version?: number }).version === remota.version) {
    const vocabulario = validar(enCache, 'caché local');
    console.log(
      `  vocabulario: el backend sigue en la versión ${remota.version}; se reutiliza la caché ` +
        `con ${vocabulario.entradas.length} entrada(s).`
    );
    return vocabulario;
  }

  const descargado = await pedir(`${raiz}/vocabulario.json`, token);
  const vocabulario = validar(descargado, `${raiz}/vocabulario.json`);

  await mkdir(path.dirname(CACHE), { recursive: true });
  await writeFile(CACHE, JSON.stringify(descargado), 'utf8');

  console.log(
    `  vocabulario: descargado del backend, versión ${vocabulario.version}, ` +
      `${vocabulario.entradas.length} entrada(s), generado el ${vocabulario.generado_en}.`
  );
  return vocabulario;
}

let pendiente: Promise<Vocabulario> | null = null;

/**
 * Carga el vocabulario una sola vez por build. Todas las páginas comparten la misma promesa:
 * sin esto, cada una de las treinta y tantas rutas alfabéticas repetiría la descarga.
 */
export function cargarVocabulario(): Promise<Vocabulario> {
  pendiente ??= (async () => {
    const base = variable('EXPORT_URL');

    if (!base) return desdeLocal();

    try {
      return await desdeBackend(base, variable('EXPORT_TOKEN'));
    } catch (error) {
      const motivo = error instanceof Error ? error.message : String(error);
      throw new Error(
        `EXPORT_URL apunta a ${base} pero la exportación falló: ${motivo}\n` +
          `El build se detiene a propósito. Publicar con la copia local significaría publicar ` +
          `un diccionario viejo sin que nadie lo note; si es lo que se quiere, quitar ` +
          `EXPORT_URL del entorno y volver a compilar.`
      );
    }
  })();

  return pendiente;
}

/** Grupo alfabético: las entradas que empiezan por un mismo grafema. */
export interface GrupoAlfabetico {
  posicion: number;
  grafema: string;
  slug: string;
  entradas: Entrada[];
}

/**
 * Reparte las entradas en los 32 grupos del alfabeto, incluidos los que quedan vacíos: la
 * navegación alfabética muestra el alfabeto completo, y una letra sin entradas es información
 * («todavía no hay nada con `r`»), no un hueco que convenga esconder.
 *
 * No reordena nada. Las entradas llegan ya en orden Mam desde el backend y se reparten
 * conservándolo.
 */
export function porLetra(entradas: Entrada[]): GrupoAlfabetico[] {
  const grupos = GRAFEMAS.map((grafema, indice) => ({
    posicion: indice + 1,
    grafema,
    slug: slugDeGrafema(grafema),
    entradas: [] as Entrada[],
  }));

  for (const entrada of entradas) {
    grupos[posicionInicial(entrada.orden) - 1]?.entradas.push(entrada);
  }

  return grupos;
}

/** Tema con sus entradas, en el orden del panel. */
export interface GrupoTematico {
  categoria: Categoria;
  entradas: Entrada[];
}

export function porTema(vocabulario: Vocabulario): GrupoTematico[] {
  const porSlug = new Map<string, Entrada[]>(
    vocabulario.categorias.map((categoria) => [categoria.slug, []])
  );

  for (const entrada of vocabulario.entradas) {
    for (const tema of entrada.temas) porSlug.get(tema)?.push(entrada);
  }

  return [...vocabulario.categorias]
    .sort((a, b) => a.orden - b.orden)
    .map((categoria) => ({ categoria, entradas: porSlug.get(categoria.slug) ?? [] }));
}

/**
 * Fuentes distintas citadas por un conjunto de entradas, con el índice que les toca.
 *
 * Repetir la ficha bibliográfica completa bajo cada entrada multiplicaría el HTML por nada:
 * las 42 entradas actuales citan dos fuentes, y el corpus completo no llegará a una docena.
 * Se numeran una vez al pie y cada entrada lleva solo su número.
 */
export function fuentesCitadas(entradas: Entrada[]): Fuente[] {
  const vistas = new Map<string, Fuente>();

  for (const { fuente } of entradas) {
    if (fuente === null) continue;
    const clave = `${fuente.titulo}|${fuente.institucion}|${fuente.anio}`;
    if (!vistas.has(clave)) vistas.set(clave, fuente);
  }

  return [...vistas.values()];
}

/** Índice (base 1) de la fuente de una entrada dentro de `fuentesCitadas`, o `null`. */
export function indiceDeFuente(entrada: Entrada, fuentes: Fuente[]): number | null {
  if (entrada.fuente === null) return null;

  const indice = fuentes.findIndex(
    (fuente) =>
      fuente.titulo === entrada.fuente!.titulo &&
      fuente.institucion === entrada.fuente!.institucion &&
      fuente.anio === entrada.fuente!.anio
  );

  return indice === -1 ? null : indice + 1;
}
