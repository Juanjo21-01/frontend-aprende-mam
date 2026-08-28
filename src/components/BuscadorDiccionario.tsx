/**
 * El buscador del diccionario. La primera isla del proyecto y, por ahora, el único
 * JavaScript que el sitio manda al navegador.
 *
 * Busca sobre el vocabulario completo descargado como archivo estático, no contra la API:
 * por eso sigue funcionando sin conexión una vez que el service worker lo tenga en caché.
 *
 * Tres decisiones que se ven en el código:
 *
 *  - **El vocabulario se descarga cuando la persona va a buscar**, no al abrir la página. En
 *    3G, bajar el diccionario entero para alguien que venía a leer la lección de los colores
 *    es gastarle los datos a cambio de nada. Se dispara al enfocar la caja.
 *  - **Se busca en los dos idiomas.** Contra `busqueda` para el Mam, que es el campo que el
 *    backend dejó plegado, y contra el castellano plegado aquí con la misma regla. Una
 *    estudiante pregunta «¿cómo se dice perro?» mucho más seguido de lo que reconoce `tx’yan`
 *    escrito.
 *  - **El orden de los resultados no es alfabético sino por calidad de coincidencia**, y
 *    dentro de cada nivel se conserva el orden del Mam que ya trae el arreglo. Quien escribe
 *    «saq» quiere `saq` primero, no la primera palabra del alfabeto que lo contenga.
 */
import { useEffect, useMemo, useRef, useState } from 'react';

import { buscar, claveDeBusqueda, type DatosBusqueda } from '@/data/busqueda';
import { temaVisual } from '@/data/temas';

interface Props {
  /** URL del vocabulario versionado. La calcula la página con `rutaDeDatos()`. */
  ruta: string;
  /** Cuántas palabras hay publicadas. Se sabe en compilación y evita un texto vago. */
  total: number;
  /** Prefijo de rutas del sitio, para enlazar los temas. */
  base: string;
}

type Estado =
  | { fase: 'dormido' }
  | { fase: 'cargando' }
  | { fase: 'listo'; datos: DatosBusqueda }
  | { fase: 'error' };

/** Cuántos resultados se pintan. Más que esto nadie los lee, y cada uno cuesta DOM. */
const MAXIMO = 40;

export default function BuscadorDiccionario({ ruta, total, base }: Props) {
  const [estado, setEstado] = useState<Estado>({ fase: 'dormido' });
  const [consulta, setConsulta] = useState('');

  // En el HTML compilado esto vale `false`, así que la caja sale desactivada y con su aviso.
  // Sin JavaScript se queda así, que es la verdad: la búsqueda no funciona. La navegación por
  // letra y por tema, que sí funciona sin JavaScript, está en la misma página.
  const [hidratado, setHidratado] = useState(false);
  useEffect(() => setHidratado(true), []);

  const pedido = useRef(false);

  function asegurarDatos() {
    if (pedido.current) return;
    pedido.current = true;

    setEstado({ fase: 'cargando' });

    fetch(ruta)
      .then((respuesta) => {
        if (!respuesta.ok) throw new Error(String(respuesta.status));
        return respuesta.json() as Promise<DatosBusqueda>;
      })
      .then((datos) => setEstado({ fase: 'listo', datos }))
      .catch(() => {
        // Reintentar en el siguiente enfoque: lo más probable es que sea la conexión.
        pedido.current = false;
        setEstado({ fase: 'error' });
      });
  }

  const datos = estado.fase === 'listo' ? estado.datos : null;

  // El castellano se pliega una sola vez al cargar, no en cada tecla. Son seis mil cadenas y
  // cinco pasadas de normalización Unicode cada una: hacerlo por pulsación se nota en un
  // teléfono de gama baja.
  const plegados = useMemo(
    () => (datos ? datos.entradas.map((entrada) => claveDeBusqueda(entrada.espanol)) : []),
    [datos]
  );

  const resultados = useMemo(
    () => (datos ? buscar(datos, plegados, consulta) : []),
    [datos, plegados, consulta]
  );

  const consultando = consulta.trim() !== '';
  const mostrados = resultados.slice(0, MAXIMO);

  return (
    <section>
      <label htmlFor="buscador" className="block font-bold">
        Buscar una palabra
      </label>

      {/*
        El filo dorado va en un elemento aparte y no como `border-b` del propio campo: un
        borde de cuatro píxeles en un solo lado desplaza el texto hacia arriba dentro de la
        caja. El contorno de foco se pone en el envoltorio con `focus-within`, porque el
        `:focus-visible` del campo quedaría recortado por el `overflow-hidden`.
      */}
      <div className="mt-2 overflow-hidden rounded-xl border-2 border-jade-hondo focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-jade">
        <input
          id="buscador"
          type="search"
          value={consulta}
          disabled={!hidratado}
          onFocus={asegurarDatos}
          onChange={(evento) => {
            asegurarDatos();
            setConsulta(evento.target.value);
          }}
          placeholder="perro, tx’yan, saq…"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className="w-full bg-papel px-4 py-3 text-lg outline-none disabled:opacity-60"
        />
        <div className="h-1 bg-oro" aria-hidden="true" />
      </div>

      <p className="mt-2 text-sm text-tinta-suave">
        {hidratado ? (
          <>
            Escribe en <span lang="mam">Mam</span> o en castellano. No hace falta el saltillo ni
            la diéresis: «xiky» encuentra <span lang="mam" className="mam">ẍiky</span>.
          </>
        ) : (
          <>
            La búsqueda necesita JavaScript. Sin él puedes navegar por letra o por tema, aquí
            abajo.
          </>
        )}
      </p>

      <div aria-live="polite">
        {estado.fase === 'cargando' && (
          <p className="mt-4 text-tinta-suave">Cargando las {total} palabras…</p>
        )}

        {estado.fase === 'error' && (
          // Nunca un marco vacío: si falla la descarga hay que decir qué pasó y ofrecer lo que
          // sí funciona, que son las páginas estáticas de más abajo.
          <p className="mt-4 rounded-xl border border-oro-borde bg-oro-tinte p-4">
            No se pudo descargar el vocabulario. Puede ser la conexión. Vuelve a tocar la caja
            para reintentar, o navega por letra y por tema aquí abajo.
          </p>
        )}

        {estado.fase === 'listo' && consultando && (
          <p className="mt-4 text-sm text-tinta-suave">
            {resultados.length === 0
              ? 'Ninguna palabra coincide.'
              : resultados.length > MAXIMO
                ? `${resultados.length} palabras; se muestran las primeras ${MAXIMO}.`
                : `${resultados.length} palabra${resultados.length === 1 ? '' : 's'}.`}
          </p>
        )}
      </div>

      {mostrados.length > 0 && datos && (
        // Los resultados van como tarjeta y no como fila: aquí cada palabra viene de un tema
        // distinto, así que la etiqueta de color es lo que orienta. En las páginas de letra,
        // donde el corpus completo puede dar cientos de entradas seguidas, se usa la fila.
        <dl className="mt-3 flex flex-col gap-3">
          {mostrados.map(({ entrada }) => (
            <div key={entrada.id} className="rounded-xl border border-borde p-4">
              <dt className="flex flex-wrap items-baseline gap-x-2">
                <span lang="mam" className="mam text-2xl font-bold text-jade-hondo">
                  {entrada.mam}
                </span>
                {entrada.clase && (
                  <span className="text-sm text-tinta-suave italic">{entrada.clase}</span>
                )}
              </dt>
              <dd className="mt-1">
                <span className="text-lg">{entrada.espanol}</span>
                {entrada.definicion && (
                  <p className="mt-1 text-tinta-suave">{entrada.definicion}</p>
                )}
                {entrada.temas.length > 0 && (
                  <p className="mt-3 flex flex-wrap gap-2">
                    {entrada.temas.map((slug) => {
                      const visual = temaVisual(slug);
                      return (
                        <a
                          key={slug}
                          href={`${base}diccionario/tema/${slug}`}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-sm no-underline ${visual.etiqueta}`}
                        >
                          <span
                            className={`size-2 rounded-full ${visual.punto}`}
                            aria-hidden="true"
                          />
                          {datos.temas[slug] ?? slug}
                        </a>
                      );
                    })}
                  </p>
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
