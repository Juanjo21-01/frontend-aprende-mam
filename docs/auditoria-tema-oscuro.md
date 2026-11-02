# Auditoría de tema oscuro — Fase 8

Fecha: 1 de noviembre de 2026. Extensión del sistema B2 aprobado; Charis SIL, composición,
contenido, reglas de juegos y movimiento conservados. Público: primaria y básicos.

## Implementación

Los 21 colores del sistema reciben una variante cálida oscura. La nieve y las hojas del
logotipo conservan dos colores invariantes. Los colores claros se mantienen; imágenes,
documentos e iframes no reciben filtros de inversión ni de brillo.

La apariencia sigue inicialmente el sistema. El selector nativo del pie permite Automática,
Clara u Oscura, con etiqueta y ayuda visibles, objetivo de más de 44 px y foco en tinta.
La elección explícita se guarda localmente; Automática la elimina. Si el navegador rechaza
el guardado, el cambio se aplica a la página y un estado explica que no se pudo recordar.
Se escuchan cambios del sistema, de otra pestaña y el regreso desde la caché de navegación.

El script compartido se inserta en línea antes del CSS; no añade una isla ni una petición.
Sin scripts, la consulta CSS sigue la preferencia del sistema y el selector permanece oculto.
Los dos bloques oscuros se comparan en las pruebas para evitar divergencia entre automático
y elección manual.

`color-scheme` adapta controles nativos y barras de desplazamiento. Los metadatos de color
acompañan también la elección manual. El manifiesto y los íconos de instalación conservan
su versión clara: la pantalla de lanzamiento de la PWA puede usar ese fondo antes de abrir
el documento. No se presenta como una pantalla de lanzamiento adaptable.

Implementación basada en las interfaces documentadas de [preferencia de color](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-color-scheme),
[color-scheme](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/color-scheme)
y [theme-color](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name/theme-color).

## Contraste de la variante oscura

Relaciones calculadas sobre los valores sRGB del CSS final. Umbral de texto normal: 4,5:1;
texto grande: 3:1, según [W3C](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).

| Texto / fondo | Relación |
|---|---:|
| Tinta / papel | 14,33:1 |
| Tinta suave / papel | 9,00:1 |
| Tinta suave / papel hondo | 8,14:1 |
| Verde texto / campo | 8,10:1 |
| Rojo texto / campo | 8,58:1 |
| Amarillo texto / campo | 7,85:1 |
| Negro texto / campo | 9,93:1 |
| Rojo texto / tinte | 11,13:1 |
| Verde texto / tinte | 9,89:1 |
| Amarillo texto de tema / tinte | 8,36:1 |

Las pruebas cubren también texto auxiliar sobre campos, selección y foco. El foco usa la
tinta luminosa de la apariencia y conserva 3 px con separación de 3 px. Los campos de
acierto/error conservan ícono y texto. Los separadores decorativos no se presentan como
indicadores suficientes por sí solos.

## Verificaciones realizadas

- `npm run check`: **59 pruebas**, compilación de **61 páginas**, HTML y peso aprobados.
  Siete pruebas nuevas cubren las preferencias y su recuperación, las variantes CSS y el
  contraste de ambas paletas. Máximo inicial: **107,0 KB Brotli / 117,9 KB gzip**, bajo 150 KB.
- Sonda DOM sobre las **61 páginas oscuras a 320 px**: sin desbordamientos de página,
  contrastes de texto inferiores al umbral, etiquetas ausentes ni IDs duplicados detectados.
- **14 superficies en tres tamaños**: 320, 768 y 1280 px. Capturas de la ventana real en
  teléfono; página completa en tableta y escritorio. Las capturas móviles inicialmente
  ensanchadas por el navegador fueron reemplazadas. Los datos DOM registran 305 px útiles
  cuando la ventana de 320 px reserva barra de desplazamiento.
- **12 vistas editoriales de desarrollo**, con lectura, fuente, PDF y guardado, en los mismos
  tamaños. Las muestras siguen fuera de la compilación pública. Guardado correcto y fallo
  recuperable comprobados por interacción, con estados capturados en teléfono.
- Regresión de **14 superficies claras** a 320 px sin fallos en la sonda de contraste/reflujo.
- Elección Clara/Oscura/Automática y persistencia tras recarga comprobadas en el navegador.
  Home y Fin cambian el selector con teclado; objetivo medido en aproximadamente 139 × 50 px.
- Cambio de apariencia durante una pregunta sin perder pregunta ni retroalimentación.
  Búsqueda «xiky» con resultado «ẍiky», cartas reveladas, acierto/error de cuestionario y
  selección/acierto de sopa revisados. Casilla enfocada de aproximadamente 44 px y salida
  con Tab. Se conservan las reglas verificadas en la Fase 4.
- Con el servidor de la versión compilada detenido: respaldo sin conexión, cambio de
  apariencia y búsqueda guardada funcionando. No se simula la desconexión solo con un rótulo.
- Copia temporal de la portada con cero scripts: sin `data-tema`, fondo oscuro por CSS y
  selector oculto, siguiendo la preferencia real del sistema. Archivo temporal eliminado;
  comprobación de HTML aprobada después. Esto no equivale a probar todos los flujos con
  JavaScript deshabilitado desde la configuración del navegador.
- Detector único sobre los archivos de interfaz modificados: sin hallazgos.
- `DESIGN.md` y su sidecar schema 2 registran la extensión del sistema desde el código.

## Cobertura y límites

La sonda RGB no interpreta todas las composiciones, imágenes, filtros ni opacidades.
Las comprobaciones de tokens complementan la sonda; ninguna certifica por sí sola WCAG.
Los estados de cuestionario desactivados conservan texto y marcas visibles; no se impone
contraste a controles inactivos desde la sonda genérica.

No se probaron lectores de pantalla, hardware móvil, Safari/Firefox, zoom de texto completo
ni cambios reales de la preferencia del sistema operativo durante esta pasada. Los eventos
de cambio del sistema y los errores de almacenamiento se cubren con pruebas automatizadas;
la elección automática se observó en el navegador con su preferencia oscura real.
Las limitaciones de la auditoría de Fase 7 siguen registradas en `auditoria-ui.md`.

El contenido editorial real sigue vacío. La validación con estudiantes y comunidad y la
interpretación cultural de los rumbos siguen siendo tareas de producto pendientes.

## Revisión independiente y corrección

La revisión encontró un nombre que rebasaba su tarjeta del pie a 320 px: «Diccionario».
Se conserva el nombre completo y el tamaño del texto; bajo 420 px el ícono pasa encima del
nombre. Las recapturas `selector-foco-320.jpg` y `selector-foco-claro-320.jpg` muestran los
seis nombres contenidos. «Diccionario» conserva aproximadamente 15,65 px a ambos lados;
los controles miden al menos 84,8 px de alto. El foco del selector sigue visible.

El dictamen posterior es **`ship` para el arreglo puntuado**, sin regresiones visibles en
esas recapturas. No quedan arreglos pedidos por la revisión; esto no amplía la cobertura
a navegadores, tecnologías o dispositivos que no se probaron.

Evidencia: `.impeccable/review/tema-oscuro/`, incluidas medidas, contraste, capturas,
`review.md` y `verdict.md`. Las capturas previas de estados de descarga se conservan como
evidencia anterior al ajuste del pie; las dos recapturas del selector y `pie-corregido.json`
documentan la corrección final del componente compartido.

## Ampliación: botón manual en el encabezado

Tras la Fase 8, el usuario pidió un botón más visible para cambiar la apariencia. Se añade
un botón de sol/luna a la derecha del encabezado compartido. Alterna la apariencia efectiva,
recuerda la elección y sincroniza el selector del pie. Automática permanece disponible en
ese selector. El botón tiene nombre accesible y título «Cambiar a claro/oscuro»; desde
1280 px también muestra «Claro/Oscuro», como acción siguiente. Su envoltorio permanece
oculto sin scripts. No se añade una isla, petición ni dependencia.

Se verificaron clic, Enter, persistencia al recargar y navegar, y regreso a Automática.
Las pruebas incluyen almacenamiento bloqueado y sincronización de nombre, ícono y selector.
Check actualizado: **61 pruebas**, **61 páginas**, **107,4 KB Brotli / 118,3 KB gzip**.
Encabezado revisado en 320, 768, 1024 y 1280 px, en claro y oscuro; sin desbordamiento de
página y con botón de al menos 44 × 44 px. Evidencia y revisión de esta ampliación en
`.impeccable/review/boton-tema/`; conserva los límites de cobertura descritos arriba.
La revisión independiente de esta ampliación emitió **`ship`**, sin arreglos materiales.

## Ajuste posterior: retirar el selector del pie

Por petición del usuario se elimina el selector «Apariencia», su ayuda y la lógica asociada.
El botón del encabezado permanece como único control manual y recuerda la elección. La
preferencia del dispositivo sigue siendo el valor inicial, hasta elegir una apariencia.
Se conserva la sincronización entre pestañas y al regresar a la página; no hay una opción
visible para restablecer Automática. Si no se puede guardar, el botón sigue funcionando
durante la visita. Sin scripts, el tema sigue el sistema por CSS.

Check: **60 pruebas**, **61 páginas**, **107,2 KB Brotli / 118,0 KB gzip**. Se quitaron casos
exclusivos del selector y un caso duplicado de almacenamiento bloqueado; se conservan las
pruebas del botón, preferencia inicial, persistencia, sincronización y contraste.
En la misma vista previa `http://127.0.0.1:4334/` se comprobó la ausencia del selector,
el cambio por clic y Enter, y el pie a 320 y 1280 px. Evidencia en
`.impeccable/review/quitar-selector/`. Las secciones anteriores describen la evolución
de la Fase 8; este ajuste registra el estado final de los controles de apariencia.
