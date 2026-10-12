/**
 * La parte del contenido externo que corre en el navegador.
 *
 * No se usa directamente: la monta `ContenidoExterno.astro`, que valida la dirección en
 * compilación y pone el marco con su proporción. Aquí no se interpreta ninguna URL; llega todo
 * resuelto por `src/data/incrustado.ts`.
 *
 * Por qué una fachada y no el iframe de una vez: un iframe de YouTube arrastra cientos de
 * kilobytes de reproductor, y `loading="lazy"` no lo evita — en cuanto el marco entra en
 * pantalla se descarga todo, se vaya a ver o no. En 3G eso es gastarle los datos a quien solo
 * pasaba por la página. Así, el reproductor solo se pide cuando alguien toca.
 *
 * Las fases:
 *
 *   fachada ──toque──▶ comprobando ──hay señal──▶ montado
 *                           │
 *                           └──no hay──▶ sin-conexion ──vuelve la señal──▶ fachada
 *
 * Se sondea al tocar y no se confía en el atributo `data-conexion` del `<html>`: ese lo puso
 * la sonda de BaseLayout al cargar la página, y para cuando alguien toca el video puede llevar
 * diez minutos viejo. Una petición de 69 bytes al propio dominio cuesta menos que montar un
 * reproductor que no va a cargar.
 *
 * Antes de tocar, en cambio, sí manda ese atributo: con él, el CSS de `global.css` cambia la
 * fachada por el aviso sin necesitar esta isla. Funciona aunque no haya hidratado todavía.
 */
import { useEffect, useRef, useState, type MouseEvent } from 'react';

import { hayInternet, observarConexion } from '@/data/conexion';
import type { TipoIncrustado } from '@/data/incrustado';

export interface Miniatura {
  src: string;
  ancho: number;
  alto: number;
}

export interface Alternativa {
  href: string;
  texto: string;
}

interface Props {
  src: string;
  respaldo: string;
  permisos: string;
  tipo: TipoIncrustado;
  titulo: string;
  miniatura?: Miniatura;
  /** Adónde ir sin señal. En las actividades, el juego propio equivalente. */
  alternativa?: Alternativa;
}

type Fase = 'fachada' | 'comprobando' | 'montado' | 'sin-conexion';

/** La sonda del propio dominio, con `BASE_URL` para que sobreviva a un cambio de `base`. */
const SONDA = `${import.meta.env.BASE_URL}ping.txt`;

export default function IncrustadoExterno({
  src,
  respaldo,
  permisos,
  tipo,
  titulo,
  miniatura,
  alternativa,
}: Props) {
  const [fase, setFase] = useState<Fase>('fachada');
  const marco = useRef<HTMLIFrameElement>(null);

  // Con el aviso en pantalla se queda escuchando, y en cuanto vuelve la señal regresa a la
  // fachada. No monta el reproductor por su cuenta: eso gastaría datos sin que nadie lo pidiera.
  useEffect(() => {
    if (fase !== 'sin-conexion') return;
    return observarConexion(
      (hay) => {
        if (hay) setFase('fachada');
      },
      { url: SONDA }
    );
  }, [fase]);

  // El enlace que se tocó desaparece al montar el marco, y con él el foco del teclado. Sin
  // pasárselo al iframe, quien navega con teclado vuelve al principio de la página.
  useEffect(() => {
    if (fase === 'montado') marco.current?.focus();
  }, [fase]);

  async function comprobarYMontar() {
    setFase('comprobando');
    setFase((await hayInternet({ url: SONDA })) ? 'montado' : 'sin-conexion');
  }

  function alTocar(evento: MouseEvent<HTMLAnchorElement>) {
    // Ctrl, Cmd, Mayús o el botón central: quien los usa quiere abrirlo aparte, y el enlace
    // ya lleva al reproductor del proveedor. Se respeta.
    if (evento.button !== 0 || evento.ctrlKey || evento.metaKey || evento.shiftKey || evento.altKey) {
      return;
    }
    evento.preventDefault();
    if (fase !== 'comprobando') void comprobarYMontar();
  }

  const esVideo = tipo === 'video';

  if (fase === 'montado') {
    return (
      <iframe
        ref={marco}
        src={src}
        title={titulo}
        allow={permisos}
        allowFullScreen
        // YouTube rechaza los reproductores incrustados que llegan sin `Referer`, y algunos
        // navegadores lo quitan por defecto en los iframes. Con esto se manda solo el origen.
        referrerPolicy="strict-origin-when-cross-origin"
        className="absolute inset-0 size-full border-0"
      />
    );
  }

  if (fase === 'sin-conexion') {
    return (
      <Aviso
        esVideo={esVideo}
        alternativa={alternativa}
        alReintentar={() => void comprobarYMontar()}
      />
    );
  }

  return (
    <>
      {/* Las dos capas van en envoltorios sin ninguna utilidad de `display`: ver la trampa de
          capas explicada junto a estas clases en global.css. */}
      <div className="incrustado-con-red absolute inset-0">
        <a
          href={respaldo}
          onClick={alTocar}
          aria-busy={fase === 'comprobando'}
          className="relative flex size-full items-center justify-center no-underline"
        >
          {miniatura ? (
            <img
              src={miniatura.src}
              width={miniatura.ancho}
              height={miniatura.alto}
              alt=""
              loading="lazy"
              decoding="async"
              className="absolute inset-0 size-full object-cover"
            />
          ) : (
            // Sin miniatura propia queda el verde de la banda con su cenefa. Nunca la imagen
            // de YouTube: pedirla filtraría la visita a Google antes de que nadie toque nada,
            // y no estaría guardada sin conexión.
            <span className="cenefa absolute inset-x-0 bottom-0" aria-hidden="true" />
          )}

          <span className="relative flex flex-col items-center gap-3 px-4">
            <span className="flex size-18 items-center justify-center rounded-full bg-oro text-jade-hondo shadow-lg">
              {esVideo ? <IconoReproducir /> : <IconoActividad />}
            </span>
            <span className="rounded-full bg-jade-hondo/90 px-4 py-1.5 text-center font-bold text-papel">
              {fase === 'comprobando'
                ? 'Comprobando la conexión…'
                : esVideo
                  ? 'Ver el video'
                  : 'Abrir la actividad'}
              <span className="sr-only">: {titulo}</span>
            </span>
          </span>
        </a>
      </div>

      <div className="incrustado-sin-red absolute inset-0">
        <Aviso esVideo={esVideo} alternativa={alternativa} />
      </div>
    </>
  );
}

/**
 * Lo que ocupa el marco cuando no hay señal. Nunca un marco vacío: un iframe en blanco el
 * usuario lo lee como «la aplicación se rompió», no como «falta internet».
 *
 * Con `alReintentar` es el aviso que sale después de tocar, y lleva botón. Sin él es el que
 * pone el CSS antes de tocar, que no lo necesita: cuando vuelve la señal, la fachada vuelve
 * sola.
 */
function Aviso({
  esVideo,
  alternativa,
  alReintentar,
}: {
  esVideo: boolean;
  alternativa?: Alternativa;
  alReintentar?: () => void;
}) {
  return (
    <div
      role="status"
      className="flex size-full flex-col items-center justify-center gap-2 overflow-auto bg-papel-hondo p-4 text-center"
    >
      <IconoSinSenal />
      <p className="font-bold">
        {esVideo ? 'Este video necesita internet' : 'Esta actividad necesita internet'}
      </p>
      {/* Corto a propósito: en un teléfono, un marco de 16/9 deja unos 190 px de alto para
          todo el aviso. Con botón no hace falta decir «vuelve a intentarlo», ya lo dice él. */}
      <p className="max-w-sm text-sm text-tinta-suave">
        {alReintentar ? 'Ahora no hay señal.' : 'Ahora no hay señal. Cuando vuelva, aparecerá aquí.'}
      </p>

      {(alReintentar || alternativa) && (
        <div className="mt-1 flex flex-wrap justify-center gap-2">
          {alReintentar && (
            <button
              type="button"
              onClick={alReintentar}
              className="min-h-11 rounded-full border-2 border-jade-hondo bg-papel px-4 font-bold text-jade-hondo"
            >
              Intentar de nuevo
            </button>
          )}
          {alternativa && (
            <a
              href={alternativa.href}
              className="inline-flex min-h-11 items-center rounded-full bg-jade px-4 font-bold text-papel no-underline"
            >
              {alternativa.texto}
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function IconoReproducir() {
  // El triángulo va corrido a la derecha a propósito: centrado por su caja se ve torcido a
  // la izquierda, porque casi todo su peso visual está en el lado recto.
  return (
    <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">
      <path
        d="M8.5 5.8v12.4a.8.8 0 0 0 1.2.7l9.6-6.2a.8.8 0 0 0 0-1.4L9.7 5.1a.8.8 0 0 0-1.2.7Z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconoActividad() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="30"
      height="30"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3.6" y="3.6" width="16.8" height="16.8" rx="3.6" />
      <circle cx="8.6" cy="8.6" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="15.4" cy="15.4" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconoSinSenal() {
  // El mismo wifi del aviso «Funciona sin internet» de la portada, tachado. Se probó antes con
  // los arcos recortados para que no los cruzara la barra, y a este tamaño quedaba un garabato
  // que no se leía como nada: la figura entera tachada se reconoce al instante.
  return (
    <svg
      viewBox="0 0 24 24"
      width="30"
      height="30"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0 text-oro-hondo"
    >
      <path d="M12 20.5v-.01" />
      <path d="M8.2 16.6a5.4 5.4 0 0 1 7.6 0" />
      <path d="M4.8 12.9a10.2 10.2 0 0 1 14.4 0" />
      <path d="M1.6 9.3a15 15 0 0 1 20.8 0" />
      <path d="m3.5 3.5 17 17" />
    </svg>
  );
}
