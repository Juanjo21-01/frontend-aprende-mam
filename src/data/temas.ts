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
 * Las claves del mapa son los slugs del backend; los nombres de los tokens son cortos y
 * no siempre coinciden (`la-familia` → `familia`), porque el token es un nombre de color
 * y el slug es una URL.
 */

export interface TemaVisual {
  /** Fondo y borde de la ficha del tema. */
  ficha: string;
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
 * `` `bg-tema-${slug}-tinte` `` y esa clase no se genera, así que el color no aparece y
 * no hay ningún error que lo delate. Por eso cada cadena está escrita entera.
 */
const POR_SLUG: Record<string, TemaVisual> = {
  animales: {
    ficha: 'bg-tema-animales-tinte border-tema-animales-borde',
    texto: 'text-tema-animales',
    etiqueta: 'bg-tema-animales-tinte text-tema-animales',
    punto: 'bg-tema-animales',
  },
  'la-familia': {
    ficha: 'bg-tema-familia-tinte border-tema-familia-borde',
    texto: 'text-tema-familia',
    etiqueta: 'bg-tema-familia-tinte text-tema-familia',
    punto: 'bg-tema-familia',
  },
  colores: {
    ficha: 'bg-tema-colores-tinte border-tema-colores-borde',
    texto: 'text-tema-colores',
    etiqueta: 'bg-tema-colores-tinte text-tema-colores',
    punto: 'bg-tema-colores',
  },
  numeros: {
    ficha: 'bg-tema-numeros-tinte border-tema-numeros-borde',
    texto: 'text-tema-numeros',
    etiqueta: 'bg-tema-numeros-tinte text-tema-numeros',
    punto: 'bg-tema-numeros',
  },
  'la-naturaleza': {
    ficha: 'bg-tema-naturaleza-tinte border-tema-naturaleza-borde',
    texto: 'text-tema-naturaleza',
    etiqueta: 'bg-tema-naturaleza-tinte text-tema-naturaleza',
    punto: 'bg-tema-naturaleza',
  },
  'la-casa': {
    ficha: 'bg-tema-casa-tinte border-tema-casa-borde',
    texto: 'text-tema-casa',
    etiqueta: 'bg-tema-casa-tinte text-tema-casa',
    punto: 'bg-tema-casa',
  },
  alimentos: {
    ficha: 'bg-tema-alimentos-tinte border-tema-alimentos-borde',
    texto: 'text-tema-alimentos',
    etiqueta: 'bg-tema-alimentos-tinte text-tema-alimentos',
    punto: 'bg-tema-alimentos',
  },
};

/** Tema sin color asignado. Se ve como el resto del sitio, no roto. */
const NEUTRO: TemaVisual = {
  ficha: 'bg-papel-hondo border-borde',
  texto: 'text-jade-hondo',
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
