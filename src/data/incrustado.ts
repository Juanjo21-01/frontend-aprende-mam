/**
 * Qué contenido externo se puede incrustar en el sitio, y con qué dirección.
 *
 * Lo audiovisual de AprendeMam es solo video externo, y las actividades interactivas que no
 * son juegos propios vienen de Educaplay y Wordwall. Todo eso entra como iframe de un tercero,
 * y este módulo es el único sitio donde se decide qué tercero y con qué URL.
 *
 * Corre en compilación, desde `ContenidoExterno.astro`. La isla del navegador recibe el
 * resultado ya validado y nunca interpreta una dirección, así que este código no viaja al
 * teléfono. Es puro —sin Astro, sin `node:`, sin alias de rutas— para poder probarlo en Node
 * directamente, como `busqueda.ts`.
 *
 * TRES DECISIONES:
 *
 *  - **Lista cerrada de dominios.** El contenido llega del panel de administración, y un
 *    iframe con cualquier `src` sería una puerta para meter cualquier página dentro de un
 *    sitio para menores. Lo que no esté en la lista hace fallar el build, con un mensaje que
 *    dice qué llegó y por qué no sirve. Publicar un marco que no va a funcionar no es una
 *    opción: es exactamente el «marco vacío» que CLAUDE.md prohíbe.
 *
 *  - **Se acepta el código `<iframe>` que da el proveedor, pero nunca se pinta.** Es lo que
 *    copia un docente del botón «Compartir → Insertar», y lo que el modelo de datos guarda
 *    como `codigo_embebido`. De ese código solo se extrae el `src`; el HTML pegado no llega
 *    jamás a la página, porque pintarlo tal cual sería inyectar marcado ajeno.
 *
 *  - **YouTube siempre por `youtube-nocookie.com`.** Es el modo de privacidad mejorada: no
 *    deja cookies hasta que el video se reproduce. El público es menor de edad y el sitio
 *    declara que no recoge datos personales; mandar a cada visitante a la versión con
 *    rastreo contradiría las dos cosas. Cualquier forma de enlace de YouTube que se pegue
 *    —`watch`, `youtu.be`, `embed`, `shorts`— se reescribe a esa.
 */

export type Proveedor = 'youtube' | 'wordwall' | 'educaplay';

export type TipoIncrustado = 'video' | 'actividad';

export interface Incrustado {
  proveedor: Proveedor;
  /** Nombre para mostrar: «YouTube», «Wordwall»… */
  nombre: string;
  tipo: TipoIncrustado;
  /** Lo que va en el `src` del iframe, una vez que el usuario lo pide. */
  src: string;
  /**
   * Adónde lleva la fachada si la isla no llega a hidratar, o si se abre con Ctrl.
   *
   * En YouTube es el reproductor suelto de `youtube-nocookie` y no la página del video: sin
   * comentarios ni columna de recomendaciones, que no es adonde conviene mandar a un niño.
   */
  respaldo: string;
  /** Atributo `allow` del iframe. Solo lo que ese proveedor necesita, nada más. */
  permisos: string;
}

const NOMBRES: Record<Proveedor, string> = {
  youtube: 'YouTube',
  wordwall: 'Wordwall',
  educaplay: 'Educaplay',
};

/** Dominios admitidos por proveedor. Un subdominio de cualquiera de ellos también vale. */
const DOMINIOS: Record<Proveedor, string[]> = {
  youtube: ['youtube.com', 'youtu.be', 'youtube-nocookie.com'],
  wordwall: ['wordwall.net'],
  educaplay: ['educaplay.com'],
};

/**
 * `autoplay` en YouTube porque el usuario ya tocó la fachada: sin ese permiso tendría que
 * tocar dos veces, una para montar el reproductor y otra para que arranque. Los sensores,
 * el portapapeles y compartir que trae el código de inserción por defecto no hacen falta.
 */
const PERMISOS: Record<Proveedor, string> = {
  youtube: 'autoplay; encrypted-media; picture-in-picture; fullscreen',
  wordwall: 'fullscreen',
  educaplay: 'fullscreen',
};

const ID_YOUTUBE = /^[A-Za-z0-9_-]{11}$/;

function fallo(motivo: string, entrada: string): Error {
  const recortada = entrada.length > 140 ? `${entrada.slice(0, 137)}…` : entrada;
  return new Error(`Contenido externo inválido: ${motivo}\n  Recibido: ${recortada}`);
}

/**
 * `youtube.com.evil.com` no pertenece a `youtube.com`, y `evilyoutube.com` tampoco. Por eso
 * se compara contra el dominio entero o contra `.dominio`, nunca con un `includes`.
 */
function perteneceA(host: string, dominio: string): boolean {
  return host === dominio || host.endsWith(`.${dominio}`);
}

function proveedorDe(host: string): Proveedor | null {
  for (const proveedor of Object.keys(DOMINIOS) as Proveedor[]) {
    if (DOMINIOS[proveedor].some((dominio) => perteneceA(host, dominio))) return proveedor;
  }
  return null;
}

/** Si lo que llegó es el código `<iframe>` del proveedor, saca su `src`. Si no, lo deja. */
function extraerUrl(entrada: string): string {
  const texto = entrada.trim();
  if (!texto.startsWith('<')) return texto;

  const iframe = texto.match(/<iframe\b[^>]*?\ssrc\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
  if (!iframe) throw fallo('se pegó código HTML, pero no trae un <iframe> con su src.', entrada);

  // Los códigos de inserción escapan el `&` de la consulta como `&amp;`.
  return (iframe[1] ?? iframe[2]).replaceAll('&amp;', '&');
}

function idDeYoutube(url: URL): string | null {
  if (perteneceA(url.hostname, 'youtu.be')) return url.pathname.split('/')[1] || null;

  const [primero, segundo] = url.pathname.split('/').filter(Boolean);
  if (primero === 'watch') return url.searchParams.get('v');
  if (primero === 'embed' || primero === 'shorts' || primero === 'live') return segundo ?? null;
  return null;
}

/**
 * El segundo de inicio, para que un docente pueda enlazar «desde el minuto 2».
 *
 * Acepta `t=90`, `t=90s`, `t=1m30s` y `start=90`. Lo que no se entienda se ignora en vez de
 * hacer fallar el build: un inicio mal escrito deja el video empezando desde el principio,
 * que es un fallo menor, mientras que un dominio desconocido es un riesgo.
 */
function inicioDeYoutube(url: URL): number | null {
  const valor = url.searchParams.get('start') ?? url.searchParams.get('t');
  if (!valor) return null;

  const partes = valor.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/);
  if (!partes) return null;

  const segundos =
    Number(partes[1] ?? 0) * 3600 + Number(partes[2] ?? 0) * 60 + Number(partes[3] ?? 0);
  return segundos > 0 ? segundos : null;
}

/**
 * Valida lo que se va a incrustar y devuelve todo lo que la isla necesita.
 *
 * Lanza —y con eso detiene el build— si la entrada no es https, no es de un proveedor de la
 * lista, o es de YouTube pero no trae un identificador de video reconocible.
 */
export function prepararIncrustado(entrada: string): Incrustado {
  const texto = extraerUrl(entrada);

  let url: URL;
  try {
    url = new URL(texto);
  } catch {
    throw fallo('no es una dirección web.', entrada);
  }

  if (url.protocol !== 'https:') {
    throw fallo(`solo se aceptan direcciones https, y esta es ${url.protocol}`, entrada);
  }

  const proveedor = proveedorDe(url.hostname);

  if (proveedor === null) {
    throw fallo(
      `${url.hostname} no está entre los proveedores permitidos (YouTube, Wordwall, ` +
        `Educaplay). Si hace falta otro, se agrega en src/data/incrustado.ts.`,
      entrada
    );
  }

  if (proveedor === 'youtube') {
    const id = idDeYoutube(url);

    if (id === null || !ID_YOUTUBE.test(id)) {
      throw fallo('es de YouTube, pero no se encontró el identificador del video.', entrada);
    }

    const inicio = inicioDeYoutube(url);
    const desde = inicio === null ? '' : `&start=${inicio}`;
    const reproductor = `https://www.youtube-nocookie.com/embed/${id}`;

    return {
      proveedor,
      nombre: NOMBRES[proveedor],
      tipo: 'video',
      // `rel=0` limita los videos sugeridos al final a los del mismo canal: lo más cerca de
      // «sin recomendaciones» que YouTube permite desde 2018. `playsinline` evita que el
      // iPhone salte a pantalla completa al darle reproducir.
      src: `${reproductor}?autoplay=1&rel=0&playsinline=1${desde}`,
      respaldo: `${reproductor}?rel=0${desde}`,
      permisos: PERMISOS[proveedor],
    };
  }

  // Wordwall y Educaplay: la dirección se usa tal como la da el proveedor. No se reescribe
  // porque sus formatos de inserción no están documentados como el de YouTube, y adivinarlos
  // daría marcos rotos que solo se descubren al publicar.
  return {
    proveedor,
    nombre: NOMBRES[proveedor],
    tipo: 'actividad',
    src: url.href,
    respaldo: url.href,
    permisos: PERMISOS[proveedor],
  };
}
