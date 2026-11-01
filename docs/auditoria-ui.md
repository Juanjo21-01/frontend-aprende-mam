# Auditoría de cierre de UI — Fase 7

Fecha: 1 de noviembre de 2026. Sistema evaluado: tema claro B2 aprobado, con Charis SIL.

## Resultado

Integridad de implementación: **aprobada en el alcance comprobado**. El sitio conserva el
sistema acordado: campos claros, texto oscuro, íconos lineales y relieve en controles. El
tema oscuro corresponde a la Fase 8 y no se presenta como implementado.

| Dimensión | Puntuación | Evidencia y límite |
|---|---:|---|
| Accesibilidad | 3/4 | Semántica, etiquetas, contraste RGB y teclado comprobados; sin prueba con lector de pantalla real. |
| Rendimiento | 4/4 | 61 páginas, presupuesto verificado por ruta, fuentes recortadas y React limitado a islas. |
| Tematización | 3/4 | Tokens coherentes y paleta antigua retirada; variante oscura aún pendiente por diseño. |
| Responsivo | 3/4 | Todas las páginas a 320 px y capturas de tres tamaños; sin gestos sintetizados ni dispositivo físico. |
| Integridad | 4/4 | Componentes compartidos, sin muestras publicadas, sistema documentado. |
| **Total** | **17/20** | **Bueno; las reservas de cobertura se explican abajo.** |

No quedan hallazgos materiales abiertos en esta pasada. El resultado no equivale a una
declaración de conformidad completa con WCAG ni a una medición de rendimiento en un teléfono real.

## Correcciones realizadas

- **[P2] Etiquetas de tema demasiado pequeñas para el objetivo interno.** Los enlaces de tema
  de buscador y fichas medían 32 px de alto. Ahora alcanzan 44 px. Esto corrige la regla del
  proyecto; no se presenta como un incumplimiento demostrado del mínimo AA de 24 px.
- **[P2] Referencias bibliográficas pequeñas.** Las referencias dedicadas reciben una caja de
  al menos 44 × 44 px; los enlaces dentro de prosa conservan el flujo de lectura.
- **[P2] Marca compacta en tableta.** La revisión independiente detectó que el enlace del
  logotipo medía 36 × 44 px al ocultarse el nombre. Se fija un ancho mínimo de 44 px y se
  centra el ícono; se recapturan las vistas de tableta y se mide de nuevo el objetivo.
- **[P2] Muestras incluidas en producción.** Se elimina el muestrario de fundamentos previsto
  para esta fase. La prueba tipográfica se conserva únicamente en desarrollo, como las otras
  muestras. La compilación pasa de 63 a 61 páginas.
- Se retiran los tokens jade/oro/alerta y la cenefa sin uso. Se conserva la paleta B2.
- Se reserva espacio de desplazamiento para la barra inferior, se permite partir títulos
  excepcionalmente largos y los encabezados de juego tienen nombres accesibles concisos.
- `check:html` ahora rechaza rutas de prueba publicadas accidentalmente. Sitemap y precache
  también excluyen cualquier ruta con el prefijo de pruebas.
  Se comprobó el rechazo creando una muestra temporal en `dist/`, observando el fallo y
  retirándola; después la comprobación volvió a pasar.
- Se concilian las notas del plan con el ancho real de panel (1152 px) y la respuesta
  instantánea de los controles cuando se solicita movimiento reducido.

## Verificación automática y de navegador

- `npm run check`: **52 pruebas**, build de **61 páginas**, HTML y peso aprobados.
- Carga inicial máxima: **106,0 KB Brotli**, **116,6 KB gzip**, frente al límite de 150 KB.
- **1937 enlaces internos** y sus anclas revisados con un parser de HTML: sin destinos ausentes.
- Las **61 páginas compiladas** se recorrieron en Chromium/WebView a una ventana de 320 px
  (305 px útiles con barra de desplazamiento). Un `h1`, un `main`, idioma `es`, sin IDs
  duplicados, formularios sin etiqueta, imágenes sin texto alternativo o dimensiones ni
  transformaciones de caja sobre los elementos `lang="mam"` examinados.
- No se detectaron contrastes RGB inferiores al umbral en el texto examinado. La sonda
  compone fondos de ancestros con alfa y distingue texto grande; no interpreta imágenes,
  filtros ni toda posible composición visual. El logotipo y los controles inactivos no se
  usan para exigir contraste de texto normal.
- Se capturaron **42 vistas** de 14 superficies en 320, 768 y 1280 px. También hay capturas
  de buscador con foco, índice de juegos abierto y salida del tablero con teclado.
- El enlace de tema del buscador se midió en **44 px**. En la sopa, la casilla enfocada midió
  **44 px** y la tecla Fin desplazó únicamente la región del tablero; Tab permitió salir.
  El foco de salida quedó visible por encima de la navegación inferior.
- Los enlaces en línea dentro de prosa y filas, y el salto de contenido oculto hasta recibir
  foco, se separan de los controles dedicados al interpretar la lista de objetivos pequeños.

Los criterios de contraste de texto se toman de [W3C, contraste mínimo](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).
El mínimo AA de tamaño y el foco no oculto se contrastaron con [WCAG 2.2](https://www.w3.org/TR/WCAG22/).
El proyecto mantiene su objetivo táctil propio de 44 px.

## Detector y coherencia

La pasada final del detector encontró un único aviso informativo: texto de 10 px en la
prueba tipográfica de desarrollo. Ese tamaño es parte de la demostración de glifos, no un
token ni una regla del producto; la ruta no se compila. No se silenció globalmente el valor
ni se añadió a la escala del sistema. No se hallaron defectos materiales del detector en las
superficies publicadas.

`DESIGN.md` recoge los tokens y reglas del código final. `.impeccable/design.json` contiene
las extensiones y ejemplos autónomos de componentes, sin agregar una dependencia al sitio.

## Cobertura y límites

Se probaron ventanas emuladas y teclado en el navegador disponible. No se usó axe, no se
probaron lectores de pantalla, gestos táctiles sintetizados, Safari/Firefox ni hardware móvil.
La ventana de 320 px comprueba el reflujo estrecho, pero no sustituye toda prueba de zoom de
texto. La alternativa de movimiento reducido se verificó en el CSS; no se cambió la
preferencia del sistema durante esta pasada.

El contenido editorial publicado sigue vacío. Lecturas, video y PDF con contenido se
validaron mediante muestras de desarrollo en las fases anteriores; sus resultados están en
el registro del rediseño. No se han inventado lecciones para completar la auditoría.

La validación cultural de la interpretación de los rumbos sigue pendiente antes de presentarla
como un dato cultural. Las pruebas con estudiantes y comunidad no se sustituyen por esta revisión.

Evidencia técnica, capturas y dictamen independiente: `.impeccable/review/cierre/`.

## Revisión independiente

Se revisaron 45 capturas. El único hallazgo material fue el enlace de marca de 36 × 44 px
en tableta. Tras corregirlo, las 14 recapturas y medidas de `logo-tableta.json` confirman
44 × 44 px sin regresiones; el dictamen de la corrección es `ship`. El informe inicial y
el veredicto están en `.impeccable/review/cierre/review.md` y `verdict.md`. Los datos de la
sonda de tableta anteriores al ajuste se conservan como evidencia del hallazgo; las
medidas posteriores y las capturas reemplazadas documentan su resolución.
