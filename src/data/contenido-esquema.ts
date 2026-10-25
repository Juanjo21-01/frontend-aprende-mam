/**
 * El contrato de `contenido.json` y su validación. Puro: sin Astro, sin `node:`, sin alias, para
 * poder probarlo en Node directamente, como `busqueda.ts` e `incrustado.ts`.
 *
 * `contenido.json` es la segunda salida de `ExportController` del backend (la primera es
 * `vocabulario.json`): el contenido editorial que el docente escribe en el panel. Las páginas
 * traen el cuerpo en **Markdown simple** y los documentos, los metadatos de un PDF. Los dos
 * pueden llevar un `video_url`, porque el video no tiene sección propia: va junto al contenido
 * que acompaña.
 *
 * Qué se comprueba aquí y qué no:
 *
 *  - La forma. Una clave que falta o un tipo equivocado detiene el build con un mensaje que
 *    dice qué entrada falla. Publicar un sitio a medias en silencio es peor que no publicar.
 *  - NO se interpreta el Markdown ni el `video_url`: eso lo hacen `markdown.ts` e
 *    `incrustado.ts` al pintar la página, y también revientan el build si algo no sirve.
 */

export const SECCIONES = ['cultura', 'gramatica', 'base_legal'] as const;

export type Seccion = (typeof SECCIONES)[number];

export const TIPOS_DOCUMENTO = ['guia', 'ficha', 'cuadernillo', 'infografia'] as const;

export type TipoDocumento = (typeof TIPOS_DOCUMENTO)[number];

/** Procedencia bibliográfica. Sin `pagina`: ese dato es de la palabra, no de la página. */
export interface FuenteDeContenido {
  titulo: string;
  institucion: string | null;
  anio: number | null;
  url: string | null;
}

export interface Pagina {
  slug: string;
  titulo: string;
  /** Markdown simple. Se convierte a HTML en compilación, con `markdown.ts`. */
  cuerpo: string;
  orden: number;
  video_url: string | null;
  fuente: FuenteDeContenido | null;
}

export interface Documento {
  slug: string;
  titulo: string;
  descripcion: string | null;
  tipo: TipoDocumento;
  /** Ruta del sitio o dirección https del PDF. Se descarga bajo demanda: nunca se precachea. */
  archivo_url: string;
  tamano_kb: number | null;
  licencia: string | null;
  orden: number;
  video_url: string | null;
  fuente: FuenteDeContenido | null;
}

export interface Contenido {
  version: number;
  generado_en: string;
  paginas: Record<Seccion, Pagina[]>;
  documentos: Documento[];
  /** De dónde salieron los datos de este build. Se imprime en el log, no en el sitio. */
  procedencia: string;
}

/** El contenido vacío: lo correcto mientras el validador no apruebe nada. */
export function contenidoVacio(procedencia: string): Contenido {
  return {
    version: 0,
    generado_en: '',
    paginas: { cultura: [], gramatica: [], base_legal: [] },
    documentos: [],
    procedencia,
  };
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const esTexto = (valor: unknown): valor is string => typeof valor === 'string' && valor !== '';
const esTextoONulo = (valor: unknown): valor is string | null =>
  valor === null || valor === undefined || typeof valor === 'string';
const esNumeroONulo = (valor: unknown): valor is number | null =>
  valor === null || valor === undefined || typeof valor === 'number';

export function validarContenido(datos: unknown, procedencia: string): Contenido {
  const fallo = (mensaje: string): never => {
    throw new Error(`Contenido inválido (${procedencia}): ${mensaje}`);
  };

  if (typeof datos !== 'object' || datos === null) fallo('la raíz no es un objeto.');

  const raiz = datos as Record<string, unknown>;

  if ('entradas' in raiz || 'categorias' in raiz) {
    fallo(
      'trae `entradas` o `categorias`: esto es `vocabulario.json`, no `contenido.json`. ' +
        'Cada exportación tiene su archivo.'
    );
  }

  if (typeof raiz.version !== 'number') fallo('falta `version` o no es un número.');
  if (typeof raiz.generado_en !== 'string') fallo('falta `generado_en`.');

  if (typeof raiz.paginas !== 'object' || raiz.paginas === null || Array.isArray(raiz.paginas)) {
    fallo('falta el objeto `paginas`.');
  }
  if (!Array.isArray(raiz.documentos)) fallo('falta el arreglo `documentos`.');

  const crudas = raiz.paginas as Record<string, unknown>;

  for (const clave of Object.keys(crudas)) {
    if (!(SECCIONES as readonly string[]).includes(clave)) {
      fallo(`la sección «${clave}» no existe. Las del contrato son: ${SECCIONES.join(', ')}.`);
    }
  }

  const fuenteDe = (valor: unknown, cual: string): FuenteDeContenido | null => {
    if (valor === null || valor === undefined) return null;
    if (typeof valor !== 'object') return fallo(`${cual}: \`fuente\` no es un objeto.`);

    const f = valor as Record<string, unknown>;
    if (!esTexto(f.titulo)) fallo(`${cual}: la fuente no tiene \`titulo\`.`);
    if (!esTextoONulo(f.institucion) || !esNumeroONulo(f.anio) || !esTextoONulo(f.url)) {
      fallo(`${cual}: la fuente tiene campos de tipo equivocado.`);
    }

    return {
      titulo: f.titulo as string,
      institucion: (f.institucion as string | null | undefined) ?? null,
      anio: (f.anio as number | null | undefined) ?? null,
      url: (f.url as string | null | undefined) ?? null,
    };
  };

  const paginas = { cultura: [], gramatica: [], base_legal: [] } as Record<Seccion, Pagina[]>;

  for (const seccion of SECCIONES) {
    const lista = crudas[seccion] ?? [];
    if (!Array.isArray(lista)) fallo(`\`paginas.${seccion}\` no es un arreglo.`);

    const vistos = new Set<string>();

    for (const cruda of lista as Record<string, unknown>[]) {
      const cual = `página «${cruda?.slug ?? '¿?'}» de ${seccion}`;

      if (!esTexto(cruda.slug) || !SLUG.test(cruda.slug)) {
        fallo(`${cual}: el \`slug\` no sirve para una dirección (minúsculas, números y guiones).`);
      }
      // Dos páginas con el mismo slug caerían en la misma ruta y una taparía a la otra.
      if (vistos.has(cruda.slug as string)) fallo(`${cual}: slug repetido en la sección.`);
      vistos.add(cruda.slug as string);

      if (!esTexto(cruda.titulo)) fallo(`${cual}: falta \`titulo\`.`);
      if (typeof cruda.cuerpo !== 'string') fallo(`${cual}: falta \`cuerpo\`.`);
      if (typeof cruda.orden !== 'number') fallo(`${cual}: falta \`orden\`.`);
      if (!esTextoONulo(cruda.video_url)) fallo(`${cual}: \`video_url\` no es texto.`);

      paginas[seccion].push({
        slug: cruda.slug as string,
        titulo: cruda.titulo as string,
        cuerpo: cruda.cuerpo as string,
        orden: cruda.orden as number,
        video_url: (cruda.video_url as string | null | undefined) || null,
        fuente: fuenteDe(cruda.fuente, cual),
      });
    }
  }

  const documentos: Documento[] = [];
  const vistos = new Set<string>();

  for (const cruda of raiz.documentos as Record<string, unknown>[]) {
    const cual = `documento «${cruda?.slug ?? '¿?'}»`;

    if (!esTexto(cruda.slug) || !SLUG.test(cruda.slug)) fallo(`${cual}: \`slug\` inválido.`);
    if (vistos.has(cruda.slug as string)) fallo(`${cual}: slug repetido.`);
    vistos.add(cruda.slug as string);

    if (!esTexto(cruda.titulo)) fallo(`${cual}: falta \`titulo\`.`);
    if (!(TIPOS_DOCUMENTO as readonly string[]).includes(cruda.tipo as string)) {
      fallo(`${cual}: \`tipo\` «${cruda.tipo}» no es uno de ${TIPOS_DOCUMENTO.join(', ')}.`);
    }
    // Sin archivo no hay documento: un botón de descarga que no lleva a nada es un marco vacío.
    if (!esTexto(cruda.archivo_url)) fallo(`${cual}: falta \`archivo_url\`.`);
    if (!/^(https:\/\/|\/(?!\/))/.test(cruda.archivo_url as string)) {
      fallo(`${cual}: \`archivo_url\` tiene que ser https o una ruta del sitio.`);
    }
    if (typeof cruda.orden !== 'number') fallo(`${cual}: falta \`orden\`.`);
    if (!esTextoONulo(cruda.descripcion) || !esTextoONulo(cruda.licencia)) {
      fallo(`${cual}: \`descripcion\` o \`licencia\` de tipo equivocado.`);
    }
    if (!esNumeroONulo(cruda.tamano_kb) || !esTextoONulo(cruda.video_url)) {
      fallo(`${cual}: \`tamano_kb\` o \`video_url\` de tipo equivocado.`);
    }

    documentos.push({
      slug: cruda.slug as string,
      titulo: cruda.titulo as string,
      descripcion: (cruda.descripcion as string | null | undefined) || null,
      tipo: cruda.tipo as TipoDocumento,
      archivo_url: cruda.archivo_url as string,
      tamano_kb: (cruda.tamano_kb as number | null | undefined) ?? null,
      licencia: (cruda.licencia as string | null | undefined) || null,
      orden: cruda.orden as number,
      video_url: (cruda.video_url as string | null | undefined) || null,
      fuente: fuenteDe(cruda.fuente, cual),
    });
  }

  return {
    version: raiz.version as number,
    generado_en: raiz.generado_en as string,
    paginas,
    documentos,
    procedencia,
  };
}
