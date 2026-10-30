/**
 * Las secciones del sitio y el rumbo que lleva cada una.
 *
 * Es la fuente única para todo lo que navega: la barra superior (tableta y escritorio), la
 * barra inferior (teléfono), el bloque «Todas las secciones» del pie y los rumbos de la
 * portada. Si una sección cambia de nombre, de ruta o de color, se cambia aquí y nada más.
 *
 * El reparto de colores es el de docs/rediseno-ui.md: el verde es el centro (el diccionario),
 * y cada uno de los cuatro rumbos lleva una sección. Base legal no tiene rumbo: es material de
 * respaldo institucional y vive en el pie.
 */

export type Rumbo = 'verde' | 'rojo' | 'amarillo' | 'blanco' | 'negro' | 'neutro';

export interface Seccion {
  /** Ruta sin la base ni la barra final: `''` es la portada. */
  ruta: string;
  nombre: string;
  /** Una línea para las tarjetas de sección. */
  descripcion: string;
  rumbo: Rumbo;
  /** Palabra de color en Mam del rumbo, tal cual viene del vocabulario. */
  palabraMam?: string;
  /** Trazos del ícono, para un `viewBox="0 0 24 24"` con `stroke="currentColor"`. */
  icono: string;
}

export interface EstiloRumbo {
  /** Campo claro y texto encima: los botones de sección. */
  campo: string;
  /**
   * La sección activa en la navegación. Igual que `campo`, salvo el blanco: un campo papel
   * sobre el encabezado papel no se distinguiría, así que su activo va en papel hondo con filo.
   */
  activo: string;
  /** Solo el color del texto, para el ícono activo de la barra inferior. */
  texto: string;
  /** Color pleno de la sombra de `tocable`. */
  sombra: string;
}

/**
 * Clases **completas**, nunca compuestas: el escáner de Tailwind lee el código como texto y no
 * vería `` `bg-${rumbo}-campo` ``. Mismo motivo que en `temas.ts`.
 *
 * El blanco no tiene campo propio: es el papel con borde, y su sombra es el borde.
 */
export const ESTILO_RUMBO: Record<Rumbo, EstiloRumbo> = {
  verde: {
    campo: 'bg-verde-campo text-verde-texto',
    activo: 'bg-verde-campo text-verde-texto',
    texto: 'text-verde-texto',
    sombra: '[--tocable-sombra:var(--color-verde)]',
  },
  rojo: {
    campo: 'bg-rojo-campo text-rojo-texto',
    activo: 'bg-rojo-campo text-rojo-texto',
    texto: 'text-rojo-texto',
    sombra: '[--tocable-sombra:var(--color-rojo)]',
  },
  amarillo: {
    campo: 'bg-amarillo-campo text-amarillo-texto',
    activo: 'bg-amarillo-campo text-amarillo-texto',
    texto: 'text-amarillo-texto',
    sombra: '[--tocable-sombra:var(--color-amarillo)]',
  },
  blanco: {
    campo: 'bg-papel text-tinta border-2 border-borde',
    activo: 'bg-papel-hondo text-tinta ring-2 ring-inset ring-borde',
    texto: 'text-tinta',
    sombra: '',
  },
  negro: {
    campo: 'bg-negro-campo text-negro-texto',
    activo: 'bg-negro-campo text-negro-texto',
    texto: 'text-negro-texto',
    sombra: '[--tocable-sombra:var(--color-negro)]',
  },
  // En el borde y no en papel hondo: el pie es papel hondo, y Base legal desaparecía en él.
  neutro: {
    campo: 'bg-borde text-tinta',
    activo: 'bg-borde text-tinta',
    texto: 'text-tinta',
    sombra: '[--tocable-sombra:var(--color-tinta-suave)]',
  },
};

const ICONOS = {
  inicio: 'M4 10.5 12 4l8 6.5M6 9v10h4.5v-5h3v5H18V9',
  diccionario: 'M5 4.5h10a3 3 0 0 1 3 3V20H8a3 3 0 0 1-3-3ZM5 17a3 3 0 0 1 3-3h10M9 8.5h5',
  juegos:
    'M4.5 4.5h15v15h-15ZM8.5 8.5h.01M15.5 8.5h.01M12 12h.01M8.5 15.5h.01M15.5 15.5h.01',
  gramatica: 'M3.5 18 8 6l4.5 12M5 14h6M15 18v-6.5a2.5 2.5 0 0 1 5 0V18M20 14.5h-5',
  cultura: 'M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1M12 8.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Z',
  materiales: 'M7 3.5h7l4 4V20.5H7ZM14 3.5v4h4M10 12h5M10 15.5h5',
  baseLegal: 'M12 4v16M8 20h8M5 7h14M7.5 7 5 13a2.5 2.5 0 0 0 5 0Zm9 0L14 13a2.5 2.5 0 0 0 5 0Z',
  mas: 'M5.5 5.5h4v4h-4ZM14.5 5.5h4v4h-4ZM5.5 14.5h4v4h-4ZM14.5 14.5h4v4h-4Z',
};

export const INICIO: Seccion = {
  ruta: '',
  nombre: 'Inicio',
  descripcion: 'La portada',
  rumbo: 'verde',
  icono: ICONOS.inicio,
};

export const DICCIONARIO: Seccion = {
  ruta: 'diccionario',
  nombre: 'Diccionario',
  descripcion: 'Busca en Mam o en castellano',
  rumbo: 'verde',
  icono: ICONOS.diccionario,
};

export const JUEGOS: Seccion = {
  ruta: 'juegos',
  nombre: 'Juegos',
  descripcion: 'Practica jugando',
  rumbo: 'rojo',
  palabraMam: 'kyeq',
  icono: ICONOS.juegos,
};

export const CULTURA: Seccion = {
  ruta: 'cultura',
  nombre: 'Cultura',
  descripcion: 'Relatos y calendario',
  rumbo: 'amarillo',
  palabraMam: 'q’an',
  icono: ICONOS.cultura,
};

export const GRAMATICA: Seccion = {
  ruta: 'gramatica',
  nombre: 'Gramática',
  descripcion: 'Las 32 letras',
  rumbo: 'blanco',
  palabraMam: 'saq',
  icono: ICONOS.gramatica,
};

export const MATERIALES: Seccion = {
  ruta: 'materiales',
  nombre: 'Materiales',
  descripcion: 'Guías para el aula',
  rumbo: 'negro',
  palabraMam: 'q’eq',
  icono: ICONOS.materiales,
};

export const BASE_LEGAL: Seccion = {
  ruta: 'base-legal',
  nombre: 'Base legal',
  descripcion: 'Leyes que respaldan el idioma',
  rumbo: 'neutro',
  icono: ICONOS.baseLegal,
};

/** Los cuatro rumbos, en el orden en que se muestran en la portada y en el pie. */
export const RUMBOS: Seccion[] = [JUEGOS, CULTURA, GRAMATICA, MATERIALES];

/** La barra superior: todo menos Base legal. */
export const NAV_SUPERIOR: Seccion[] = [INICIO, DICCIONARIO, ...RUMBOS];

/**
 * La barra inferior del teléfono: cuatro huecos, que es lo que cabe a 360 px con objetivos de
 * 44 px y el nombre debajo. «Más» no es una sección: lleva al bloque del pie que las lista todas.
 */
export const NAV_INFERIOR: Seccion[] = [INICIO, DICCIONARIO, JUEGOS];
export const ICONO_MAS = ICONOS.mas;

/** Para el bloque «Todas las secciones» del pie. */
export const TODAS: Seccion[] = [DICCIONARIO, ...RUMBOS, BASE_LEGAL];

/**
 * Si la ruta actual cae dentro de una sección. La portada solo es activa en sí misma: con
 * `startsWith` estaría activa en todas las páginas.
 */
export function esActiva(seccion: Seccion, actual: string, base: string): boolean {
  const ruta = `${base}/${seccion.ruta}`.replace(/\/$/, '');
  const limpia = actual.replace(/\/$/, '');
  if (seccion.ruta === '') return limpia === ruta;
  return limpia === ruta || limpia.startsWith(`${ruta}/`);
}

export function href(seccion: Seccion, base: string): string {
  return `${base}/${seccion.ruta}`;
}
