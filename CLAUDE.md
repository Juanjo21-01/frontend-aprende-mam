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

Solo se hidratan cuatro cosas: el buscador del diccionario, el reproductor de audio, los tres juegos propios y el contenedor de actividades externas.

Usar `client:visible` salvo que exista una razón concreta para `client:load`.

## Ortografía del Mam en la interfaz

- Fuente: **Charis SIL** o **Gentium Plus** (licencia OFL, de SIL International). Otras fuentes no traen el carácter `ẍ` (U+1E8D) y el navegador aplica sustitución por glifo, con lo que la letra aparece con otro tipo en medio de la palabra.
- Prueba de aceptación tipográfica: `Ẍiky kyiẍ i’ẍ napẍ q’aq’ tx’otx’`
- El buscador compara contra el campo `busqueda` del JSON (minúsculas, sin apóstrofos, `ẍ`→`x`), **no contra el campo `mam`**. Nadie escribe el saltillo al buscar.
- Mostrar siempre el campo `mam` tal cual viene del backend. No transformarlo en el cliente.
- El orden alfabético ya viene resuelto en el campo `orden_alfabetico`. No reordenar con `localeCompare`: el alfabeto Mam no es el del castellano.

## Funcionamiento sin conexión

- Precache en la instalación: estructura HTML/CSS/JS y el JSON de vocabulario.
- Bajo demanda: audio e imágenes. **No precachear audio**, revienta la cuota de almacenamiento.
- Botón explícito «Descargar esta lección para usar sin internet» por categoría, que fija en caché el audio y las imágenes del tema completo. La decisión sobre el consumo de datos es del usuario, no de la app.
- `navigator.onLine` no basta: solo informa si existe interfaz de red, no si hay internet. Combinar con una sonda ligera al propio dominio.
- Los iframes externos (Educaplay, Wordwall) nunca funcionan sin conexión. **Sustituirlos por un aviso claro con enlace a un juego propio equivalente.** Nunca dejar el marco vacío: el usuario interpreta que la aplicación se rompió.

## Audio

- MP3 mono a 64 kbps, autoalojado. **Nunca embeber YouTube para la pronunciación**: anula el offline y el reproductor pesa más que toda la página.
- Agrupar el audio de cada categoría en un sprite con mapa de offsets y posicionar con `currentTime`. En 3G el cuello de botella es la latencia por archivo, no el ancho de banda: una petición en vez de cincuenta cambia la experiencia por completo.
- YouTube sí sirve para material largo (audiocuentos, canciones), donde nadie espera consumo offline.

## Qué no hacer

- No agregar librerías de UI pesadas. Tailwind y componentes propios.
- No usar paquetes de iconos completos. SVG inline de los que realmente se usen.
- No cargar imágenes sin `loading="lazy"` ni sin dimensiones explícitas: el layout shift en gama baja se nota mucho.
- No pedir registro ni recoger datos personales. Los usuarios son menores de edad.
- No agregar analítica de terceros sin evaluar su peso y sus implicaciones de privacidad.

## Contrato de datos

`/docs/vocabulario.json` es una exportación real del backend.
Esa es la estructura de datos del proyecto: consultarla antes de escribir
cualquier código que consuma el vocabulario. No inventar campos.