/**
 * El color y el ícono de cada tema.
 *
 * Por qué existe: los usuarios son de primaria y muchos leen despacio. Un color y una
 * figura constantes dicen «esto es Animales» antes de que el nombre termine de leerse, y
 * es la única ayuda de navegación que se puede dar sin mandar JavaScript al teléfono.
 *
 * **Esta tabla es una copia**, igual que `alfabeto.ts` es copia del catálogo de grafemas
 * del backend. Los slugs los define `ExportController` y aquí solo se traducen a clases.
 * Con eso vienen dos consecuencias que hay que tener presentes:
 *
 *   - Un tema **nuevo** sale en gris, con aviso en el log del build. Es lo correcto: que
 *     no haya color no puede impedir publicar vocabulario ya revisado.
 *   - Un tema **renombrado** en Laravel pierde su color en silencio, porque el slug viejo
 *     simplemente deja de aparecer. Eso no se puede detectar desde aquí; se ve mirando el
 *     sitio.
 *
 * ## Tres grupos, no siete colores
 *
 * Desde el rediseño (docs/rediseno-ui.md) los temas no tienen un matiz cada uno: se reparten
 * en los tres colores de la paleta, rojo, amarillo y verde, en su tinte más pálido. **Lo que
 * distingue a un tema es su ícono** (`IconoTema.astro`); el color solo agrupa. Siete matices
 * propios competían con los cuatro rumbos y rompían la paleta.
 *
 * Los tintes son más pálidos que los campos de los rumbos, para que una ficha de tema no se
 * confunda con un botón de sección. Todo el texto pasa AA sobre su tinte (≥ 6:1).
 */

export interface TemaVisual {
  /** Fondo y borde de una ficha teñida entera (juegos, cabecera de la página del tema). */
  ficha: string;
  /** El cuadro del ícono en las fichas sobre papel: tinte de fondo y trazo del color. */
  chip: string;
  /** Color del nombre y del trazo del ícono. */
  texto: string;
  /** Fondo de la etiqueta que acompaña a una entrada del diccionario. */
  etiqueta: string;
  /** Relleno del punto de esa etiqueta. */
  punto: string;
}

/**
 * Clases **completas**, nunca compuestas.
 *
 * El escáner de Tailwind v4 lee el código fuente como texto: no ve
 * `` `bg-${grupo}-tinte` `` y esa clase no se genera, así que el color no aparece y no hay
 * ningún error que lo delate. Por eso cada cadena está escrita entera.
 */
const ROJO: TemaVisual = {
  ficha: 'bg-rojo-tinte border-rojo-campo',
  chip: 'bg-rojo-tinte text-rojo-texto',
  texto: 'text-rojo-texto',
  etiqueta: 'bg-rojo-tinte text-rojo-texto',
  punto: 'bg-rojo',
};

const AMARILLO: TemaVisual = {
  ficha: 'bg-amarillo-tinte border-amarillo-campo',
  chip: 'bg-amarillo-tinte text-amarillo-tinte-texto',
  texto: 'text-amarillo-tinte-texto',
  etiqueta: 'bg-amarillo-tinte text-amarillo-tinte-texto',
  punto: 'bg-amarillo',
};

const VERDE: TemaVisual = {
  ficha: 'bg-verde-tinte border-verde-campo',
  chip: 'bg-verde-tinte text-verde-texto',
  texto: 'text-verde-texto',
  etiqueta: 'bg-verde-tinte text-verde-texto',
  punto: 'bg-verde',
};

/** El reparto aprobado en docs/rediseno-ui.md. Un tema nuevo entra en uno de los tres. */
const POR_SLUG: Record<string, TemaVisual> = {
  animales: ROJO,
  'la-casa': ROJO,
  'la-familia': AMARILLO,
  numeros: AMARILLO,
  alimentos: AMARILLO,
  colores: VERDE,
  'la-naturaleza': VERDE,
};

/** Tema sin color asignado. Se ve como el resto del sitio, no roto. */
const NEUTRO: TemaVisual = {
  ficha: 'bg-papel-hondo border-borde',
  chip: 'bg-papel-hondo text-tinta',
  texto: 'text-tinta',
  etiqueta: 'bg-papel-hondo text-tinta-suave',
  punto: 'bg-tinta-suave',
};

/** Slugs por los que ya se avisó, para no repetir el aviso en cada una de las 37 rutas. */
const avisados = new Set<string>();

export function temaVisual(slug: string): TemaVisual {
  const visual = POR_SLUG[slug];
  if (visual) return visual;

  // Solo en compilación: en el navegador este módulo lo importa el buscador, y un aviso
  // en la consola del teléfono no lo lee nadie.
  if (import.meta.env.SSR && !avisados.has(slug)) {
    avisados.add(slug);
    console.warn(
      `  aviso: el tema «${slug}» no tiene color ni ícono en src/data/temas.ts. ` +
        `Se muestra en gris. Si es un tema nuevo del backend, agregarlo allí.`
    );
  }

  return NEUTRO;
}

/** Los slugs que sí tienen color. Para comprobaciones y para el ícono de reserva. */
export const SLUGS_CON_COLOR = Object.keys(POR_SLUG);
