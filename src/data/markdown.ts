/**
 * Markdown simple a HTML, en compilación y sin dependencias.
 *
 * Un paquete de Markdown completo (marked, remark…) pesa más que todo este módulo y no corre en
 * el navegador, pero sí entra al árbol de dependencias de un proyecto que se mide en kilobytes.
 * El contenido que escribe el docente cabe en un subconjunto pequeño, y el backend ya rechaza
 * al guardar lo que queda fuera de él (`MarkdownSimple.php`). Este módulo es el otro lado de ese
 * contrato: renderiza exactamente ese subconjunto y nada más.
 *
 * Admite: títulos `#`…`####`, párrafos, listas con `-`/`*` y numeradas, citas `>`, regla `---`,
 * **negrita**, *cursiva*, `código`, [enlaces](https://…) e ![imágenes](/ruta.webp).
 *
 * Tres decisiones:
 *
 *  - **Todo el texto sale escapado.** No existe forma de colar una etiqueta: el HTML que llegue
 *    en el cuerpo se muestra como texto. El backend ya lo rechaza, pero un sitio para menores
 *    no puede depender de que la validación de otro repositorio no tenga un hueco.
 *  - **Enlaces solo a `https`, rutas del sitio o anclas.** Cualquier otro destino —`javascript:`,
 *    `http:`, `data:`— se pinta como texto sin enlace.
 *  - **Las imágenes siempre llevan medidas y `loading="lazy"`**, la regla de CLAUDE.md. El
 *    Markdown no tiene dónde ponerlas, así que las resuelve quien llama con `medidas`; si no
 *    puede (una imagen de otro dominio, por ejemplo), se reserva un marco 16:9 y la imagen se
 *    ajusta dentro, para que la página no salte al cargar.
 *
 * Los títulos bajan un nivel: la página ya tiene su `<h1>`, así que `#` y `##` salen como `<h2>`.
 * Puro: sin Astro ni `node:`, para probarlo directamente con `node --test`.
 */

export interface Medidas {
  ancho: number;
  alto: number;
}

export interface OpcionesMarkdown {
  /** Medidas reales de la imagen en `src`, o `undefined` si no se pudieron averiguar. */
  medidas?: (src: string) => Medidas | undefined;
  /** Prefijo del sitio para las rutas que empiezan con `/`. Por defecto, la raíz. */
  base?: string;
}

/** Marco que se reserva para una imagen cuyas medidas no se conocen. */
export const MEDIDAS_POR_DEFECTO: Medidas = { ancho: 640, alto: 360 };

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

const escapar = (texto: string) => texto.replace(/[&<>"']/g, (c) => ESCAPES[c]!);

/** https, ruta del sitio (una sola barra) o ancla. Lo mismo que acepta el backend. */
export function esDestinoSeguro(destino: string, { permiteAncla = true } = {}): boolean {
  if (/^https:\/\/[^\s/]/i.test(destino)) return true;
  if (/^\/(?!\/)/.test(destino)) return true;
  return permiteAncla && /^#[^\s]/.test(destino);
}

function conBase(destino: string, base: string): string {
  if (base === '/' || !destino.startsWith('/')) return destino;
  return base.replace(/\/$/, '') + destino;
}

const INLINE = new RegExp(
  [
    '`([^`]+)`', // 1 código
    '!\\[([^\\]]*)\\]\\(\\s*([^\\s)]*)(?:\\s+"[^"]*")?\\s*\\)', // 2 alt, 3 src
    '\\[([^\\]]+)\\]\\(\\s*([^\\s)]*)(?:\\s+"[^"]*")?\\s*\\)', // 4 texto, 5 destino
    '\\*\\*(.+?)\\*\\*', // 6 negrita
    '\\*([^*\\s](?:[^*]*[^*\\s])?)\\*', // 7 cursiva
  ].join('|'),
  'g'
);

function enLinea(texto: string, opciones: OpcionesMarkdown): string {
  const base = opciones.base ?? '/';
  let salida = '';
  let desde = 0;

  for (const m of texto.matchAll(INLINE)) {
    salida += escapar(texto.slice(desde, m.index));
    desde = m.index + m[0].length;

    if (m[1] !== undefined) {
      salida += `<code>${escapar(m[1])}</code>`;
    } else if (m[3] !== undefined) {
      salida += imagen(m[2] ?? '', m[3], opciones);
    } else if (m[5] !== undefined) {
      const dentro = enLinea(m[4]!, opciones);
      if (esDestinoSeguro(m[5])) {
        const externo = m[5].startsWith('https://');
        salida +=
          `<a href="${escapar(conBase(m[5], base))}"` +
          (externo ? ' rel="noopener noreferrer"' : '') +
          `>${dentro}</a>`;
      } else {
        salida += dentro;
      }
    } else if (m[6] !== undefined) {
      salida += `<strong>${enLinea(m[6], opciones)}</strong>`;
    } else if (m[7] !== undefined) {
      salida += `<em>${enLinea(m[7], opciones)}</em>`;
    }
  }

  return salida + escapar(texto.slice(desde));
}

function imagen(alt: string, src: string, opciones: OpcionesMarkdown): string {
  // Una imagen con una dirección que no se admite no se pinta: sin ella la página se lee igual.
  if (!esDestinoSeguro(src, { permiteAncla: false })) return escapar(alt);

  const { ancho, alto } = opciones.medidas?.(src) ?? MEDIDAS_POR_DEFECTO;

  return (
    `<img src="${escapar(conBase(src, opciones.base ?? '/'))}" alt="${escapar(alt)}" ` +
    `width="${ancho}" height="${alto}" loading="lazy" decoding="async" data-leccion>`
  );
}

/** Direcciones de las imágenes que lleva el cuerpo, para averiguar sus medidas antes de pintar. */
export function imagenesDe(texto: string): string[] {
  return [...texto.matchAll(/!\[[^\]]*\]\(\s*([^\s)]*)/g)]
    .map((m) => m[1]!)
    .filter((src) => esDestinoSeguro(src, { permiteAncla: false }));
}

/** Convierte el cuerpo Markdown en HTML. */
export function renderMarkdown(texto: string, opciones: OpcionesMarkdown = {}): string {
  const lineas = texto.replace(/\r\n?/g, '\n').split('\n');
  const html: string[] = [];
  let parrafo: string[] = [];
  let i = 0;

  const cerrarParrafo = () => {
    if (parrafo.length === 0) return;
    html.push(`<p>${enLinea(parrafo.join(' '), opciones)}</p>`);
    parrafo = [];
  };

  while (i < lineas.length) {
    const linea = lineas[i]!;

    if (linea.trim() === '') {
      cerrarParrafo();
      i++;
      continue;
    }

    const titulo = /^(#{1,4})\s+(.+?)\s*#*\s*$/.exec(linea);
    if (titulo) {
      cerrarParrafo();
      const nivel = titulo[1]!.length <= 2 ? 2 : titulo[1]!.length === 3 ? 3 : 4;
      html.push(`<h${nivel}>${enLinea(titulo[2]!, opciones)}</h${nivel}>`);
      i++;
      continue;
    }

    if (/^ {0,3}(-{3,}|\*{3,})\s*$/.test(linea)) {
      cerrarParrafo();
      html.push('<hr>');
      i++;
      continue;
    }

    const lista = /^\s{0,3}([-*]|\d+[.)])\s+(.*)$/.exec(linea);
    if (lista) {
      cerrarParrafo();
      const ordenada = /\d/.test(lista[1]!);
      const marca = ordenada ? /^\s{0,3}\d+[.)]\s+(.*)$/ : /^\s{0,3}[-*]\s+(.*)$/;
      const items: string[] = [];

      while (i < lineas.length) {
        const item = marca.exec(lineas[i]!);
        if (!item) break;
        items.push(`<li>${enLinea(item[1]!, opciones)}</li>`);
        i++;
      }

      const etiqueta = ordenada ? 'ol' : 'ul';
      html.push(`<${etiqueta}>${items.join('')}</${etiqueta}>`);
      continue;
    }

    if (/^\s{0,3}>/.test(linea)) {
      cerrarParrafo();
      const citado: string[] = [];

      while (i < lineas.length && /^\s{0,3}>/.test(lineas[i]!)) {
        citado.push(lineas[i]!.replace(/^\s{0,3}>\s?/, ''));
        i++;
      }

      html.push(`<blockquote><p>${enLinea(citado.join(' '), opciones)}</p></blockquote>`);
      continue;
    }

    parrafo.push(linea.trim());
    i++;
  }

  cerrarParrafo();
  return html.join('\n');
}
