# AprendeMam — sitio público

Biblioteca digital del idioma maya **Mam** (variante de San Marcos, Guatemala). Astro con salida estática, islas de React y PWA. El backend Laravel vive en otro repositorio y **solo se consume en tiempo de compilación**, nunca desde el navegador.

## La restricción que manda sobre todo

Los usuarios son estudiantes y docentes de San Marcos, en teléfonos de gama baja, con conexión 3G o directamente sin señal. **El peso de la carga inicial es la métrica de éxito del proyecto.**

Presupuesto: **menos de 150 KB comprimidos** en la carga inicial. Antes de agregar cualquier dependencia, verificar si el problema se resuelve sin ella.

## Arquitectura

- Astro compila a estático. En build time consume `/api/v1/export/vocabulario.json` del backend y emite el conjunto de datos versionado como asset.
- **La búsqueda del diccionario corre en el cliente sobre ese JSON.** El dataset completo ronda los 80–150 KB comprimidos, así que cabe entero en el navegador. Esto es lo que permite que funcione sin conexión.
- **Cero llamadas a la API desde el navegador.** Si aparece un `fetch` a Laravel en código de cliente, es un error de diseño, no una optimización pendiente.

## Islas: cuándo hidratar

Por defecto **no hidratar nada**. Las secciones culturales, el vocabulario y la gramática son HTML estático sin JavaScript.

Solo se hidratan tres cosas: el buscador del diccionario, los tres juegos propios y el contenedor de actividades externas y video incrustado.

Usar `client:visible` salvo que exista una razón concreta para `client:load`.

## Ortografía del Mam en la interfaz

- Fuente: **Charis SIL** o **Gentium Plus** (licencia OFL, de SIL International). Otras fuentes no traen el carácter `ẍ` (U+1E8D) y el navegador aplica sustitución por glifo, con lo que la letra aparece con otro tipo en medio de la palabra.
- Prueba de aceptación tipográfica: `Ẍiky kyiẍ i’ẍ napẍ q’aq’ tx’otx’`
- El buscador compara contra el campo `busqueda` del JSON (minúsculas, sin apóstrofos, `ẍ`→`x`), **no contra el campo `mam`**. Nadie escribe el saltillo al buscar.
- Mostrar siempre el campo `mam` tal cual viene del backend. No transformarlo en el cliente.
- El orden alfabético ya viene resuelto en el campo `orden` de la exportación. No reordenar con `localeCompare`: el alfabeto Mam no es el del castellano.

## Funcionamiento sin conexión

- Precache en la instalación: estructura HTML/CSS/JS y el JSON de vocabulario.
- Bajo demanda: imágenes y PDF. **No precachear los PDF descargables**, revientan la cuota de almacenamiento.
- Botón explícito «Descargar esta lección para usar sin internet» por categoría, que fija en caché las imágenes del tema completo. La decisión sobre el consumo de datos es del usuario, no de la app. El video externo nunca entra en esa descarga.
- `navigator.onLine` no basta: solo informa si existe interfaz de red, no si hay internet. Combinar con una sonda ligera al propio dominio.
- Los iframes externos (Educaplay, Wordwall, video) nunca funcionan sin conexión. **Sustituirlos por un aviso claro con enlace a un juego propio equivalente.** Nunca dejar el marco vacío: el usuario interpreta que la aplicación se rompió.

## Contenido audiovisual

**No hay audio alojado ni modelado.** Se decidió no guardar archivos de audio ni sus
metadatos en la base de datos. No hay tabla de audio, no hay `audio_id` en las entradas y
no hay reproductor propio. Si aparece un sprite de MP3, un `<audio>` con archivo local o
un campo de audio en el consumo de datos, es contenido que este proyecto no tiene.

Lo audiovisual se resuelve **solo con video externo**, incrustado como iframe o enlazado:

- **El video no tiene sección propia.** Va incrustado dentro de las secciones que ya
  existen, junto al contenido al que acompaña: un video en la página cultural que lo
  motiva, otro junto a la ficha didáctica que lo usa. No hay ruta `/videos` ni índice
  general de videos.
- El video vive en la plataforma de origen (YouTube u otra). No se autoaloja.
- **Nunca funciona sin conexión.** Mismo trato que las actividades externas: sin señal se
  sustituye por un aviso claro, nunca un marco vacío.
- El iframe se carga solo cuando el usuario lo pide (`loading="lazy"` no basta: un iframe
  de YouTube arrastra cientos de KB). Fachada estática con miniatura propia y el iframe se
  monta al pulsar.
- Miniatura con dimensiones explícitas, para no provocar salto de maquetación.

Como el video aparece repartido por varias secciones y no concentrado en una, el
incrustado tiene que ser **un solo componente reutilizable**, no marcado suelto copiado en
cada página. Comparte con el contenedor de actividades externas la fachada, la detección
de conexión y el aviso de degradación: conviene que sean el mismo componente
parametrizado, o dos que se apoyen en la misma base. Es además una de las pocas islas que
se hidratan, así que cada copia divergente cuesta JavaScript en el cliente.

**Consecuencia que hay que tener presente:** la propuesta funcional firmada declara la
pronunciación como el principal valor agregado de la plataforma y describe un botón de
audio por palabra. Sin audio, esa promesa no se cumple y el diccionario queda como texto.
Es una reducción de alcance real frente al documento, no un detalle de implementación.

## Qué no hacer

- No agregar librerías de UI pesadas. Tailwind y componentes propios.
- No usar paquetes de iconos completos. SVG inline de los que realmente se usen.
- No cargar imágenes sin `loading="lazy"` ni sin dimensiones explícitas: el layout shift en gama baja se nota mucho.
- No pedir registro ni recoger datos personales. Los usuarios son menores de edad.
- No agregar analítica de terceros sin evaluar su peso y sus implicaciones de privacidad.

## Contrato de datos

La fuente de verdad es `ExportController` del backend, no ningún archivo de este repo.

`GET /api/v1/export/vocabulario.json` (token estático en cabecera) devuelve:

```jsonc
{
  "version": 12,                    // sube en cada publicación; el SW lo usa para invalidar
  "generado_en": "2026-08-22T17:44:36+00:00",
  "categorias": [
    { "slug": "la-familia", "nombre_es": "La familia", "nombre_mam": null,
      "icono": null, "orden": 2, "padre": null }
  ],
  "entradas": [
    {
      "id": 132,
      "mam": "anab’",                // mostrar tal cual, nunca transformar
      "espanol": "hermana de hombre",
      "definicion": null,
      "busqueda": "anab",            // contra este campo compara el buscador
      "orden": "01140102",           // clave de intercalación ya calculada
      "clase": "s.",                 // abreviatura de la categoría gramatical
      "municipio": null,
      "temas": ["la-familia"],       // slugs, se resuelven contra `categorias`
      "fuente": { "titulo": "…", "institucion": "…", "anio": 2011, "pagina": null }
    }
  ]
}
```

`GET /api/v1/export/version` devuelve solo `{ "version": N }`, para que la compilación
sepa si hay algo nuevo sin descargar el conjunto entero.

**Solo salen las entradas revisadas.** Mientras el validador lingüístico no apruebe el
primer lote, `entradas` viene vacío y eso es lo correcto, no un fallo.

### Los dos archivos de `/docs`

- **`/docs/vocabulario.json`** — exportación real del endpoint anterior, verificada. 42
  entradas, 7 categorías. **Este es el contrato**: escribir el consumo contra él.
- **`/docs/entradas.json`** — respuesta paginada del CRUD del panel
  (`GET /api/v1/admin/entradas`), forma `{data, links, meta}`. Sirve para saber qué ve el
  administrador. **No es el contrato del sitio público** y sus nombres de campo difieren
  casi todos: `data`/`entradas`, `orden_alfabetico`/`orden`, un objeto
  `categoria_gramatical` frente a `clase`, `categorias` con objetos frente a `temas` con
  slugs, y `pagina_fuente` suelto frente a `fuente.pagina`. Confundirlos da código que
  compila y falla en el primer build real.