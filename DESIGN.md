---
name: AprendeMam
description: Biblioteca Mam con campos claros, lectura amplia y controles que responden al toque.
colors:
  papel: "#fffdf8"
  papel-hondo: "#f5f0e6"
  tinta: "#262019"
  tinta-suave: "#5b5348"
  borde: "#ece5d8"
  verde: "#12773a"
  verde-campo: "#cfe8d6"
  verde-texto: "#0b5228"
  rojo: "#c62828"
  rojo-campo: "#f6d3cd"
  rojo-texto: "#8e1c1c"
  amarillo: "#d9a404"
  amarillo-campo: "#f8e3a3"
  amarillo-texto: "#5c4100"
  negro: "#262019"
  negro-campo: "#e6dfd4"
  negro-texto: "#262019"
  rojo-tinte: "#fbe4e1"
  amarillo-tinte: "#fdf3cf"
  amarillo-tinte-texto: "#7a5603"
  verde-tinte: "#ddf1e2"
typography:
  display:
    fontFamily: "'Charis SIL', 'Gentium Plus', Georgia, 'Times New Roman', serif"
    fontSize: "3rem"
    fontWeight: 700
    lineHeight: 1.25
  headline:
    fontFamily: "'Charis SIL', 'Gentium Plus', Georgia, 'Times New Roman', serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.25
  title:
    fontFamily: "'Charis SIL', 'Gentium Plus', Georgia, 'Times New Roman', serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.333333
  word-card:
    fontFamily: "'Charis SIL', 'Gentium Plus', Georgia, 'Times New Roman', serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.2
  translation:
    fontFamily: "'Charis SIL', 'Gentium Plus', Georgia, 'Times New Roman', serif"
    fontSize: "1.25rem"
    fontWeight: 400
    lineHeight: 1.4
  body:
    fontFamily: "'Charis SIL', 'Gentium Plus', Georgia, 'Times New Roman', serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.6
  prose:
    fontFamily: "'Charis SIL', 'Gentium Plus', Georgia, 'Times New Roman', serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.7
  label:
    fontFamily: "'Charis SIL', 'Gentium Plus', Georgia, 'Times New Roman', serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  chip:
    fontFamily: "'Charis SIL', 'Gentium Plus', Georgia, 'Times New Roman', serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.428571
rounded:
  small: "0.25rem"
  cell: "0.5rem"
  icon: "0.75rem"
  control: "1rem"
  pill: "9999px"
spacing:
  one: "0.25rem"
  two: "0.5rem"
  three: "0.75rem"
  four: "1rem"
  five: "1.25rem"
  six: "1.5rem"
  eight: "2rem"
  ten: "2.5rem"
components:
  button-green:
    backgroundColor: "{colors.verde-campo}"
    textColor: "{colors.verde-texto}"
    rounded: "{rounded.control}"
    padding: "0.75rem 1.25rem"
  button-game:
    backgroundColor: "{colors.rojo-campo}"
    textColor: "{colors.rojo-texto}"
    rounded: "{rounded.control}"
    padding: "0.75rem 1.25rem"
  button-neutral:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.control}"
    padding: "0.5rem 1rem"
  button-document:
    backgroundColor: "{colors.negro-campo}"
    textColor: "{colors.negro-texto}"
    rounded: "{rounded.control}"
    padding: "0.5rem 1rem"
  search:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.pill}"
  topic-link:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.control}"
    padding: "0.75rem"
  entry-card:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.control}"
    padding: "1rem"
  topic-chip-red:
    backgroundColor: "{colors.rojo-tinte}"
    textColor: "{colors.rojo-texto}"
    rounded: "{rounded.pill}"
    padding: "0 0.625rem"
  message-success:
    backgroundColor: "{colors.verde-tinte}"
    textColor: "{colors.verde-texto}"
    rounded: "{rounded.control}"
    padding: "1rem"
  quote:
    backgroundColor: "{colors.papel-hondo}"
    textColor: "{colors.tinta-suave}"
    rounded: "{rounded.control}"
    padding: "1.25rem"
---

# Design System: AprendeMam

## Overview

**Creative North Star: "Los cuatro rumbos con lenguaje de app"**

AprendeMam abre una biblioteca de palabras con campos claros, nombres legibles e íconos constantes. La tonalidad aprobada, «B2 · Claro», mantiene el fondo cálido y reserva los colores plenos para marcas pequeñas, franjas de sección y el relieve de los controles. La interfaz sirve a estudiantes de primaria que leen despacio y a docentes que preparan clase; su claridad no depende de adornos ni de una conexión estable.

La palabra en Mam tiene prioridad: se conserva exacta, con sus grafemas completos y una sola familia tipográfica. Las superficies de lectura permanecen planas; los controles con relieve se hunden al pulsarlos. Este documento registra el sistema claro implementado al cierre de la Fase 7. El tema oscuro sigue pendiente de la Fase 8. «Los cuatro rumbos» nombra la dirección visual aprobada; su interpretación cultural requiere validación comunitaria antes de explicarse en la interfaz.

**Key Characteristics:**

- Campos claros con texto oscuro del mismo matiz.
- Charis SIL como única familia, con pesos reales 400 y 700.
- Relieve táctil reservado a controles y lectura sobre superficies planas.
- Orientación por nombre, ícono y estado, además del color.
- Teléfono primero, navegación sin JavaScript y contenido utilizable sin señal.

## Colors

La paleta reúne papel cálido, tinta oscura, verde de búsqueda y campos rojo, amarillo y gris cálido para las secciones. Los valores normativos están en el frontmatter y corresponden a las propiedades de `src/styles/global.css`.

### Primary

- **Verde de búsqueda** (`verde`, `verde-campo`, `verde-texto`): diccionario, acción principal de recuperación y sección activa. El campo recibe el texto verde oscuro; el verde pleno sostiene el relieve y detalles de marca.

### Secondary

- **Rojo de juegos** (`rojo`, `rojo-campo`, `rojo-texto`): acceso a juegos y acciones de partida. El error comparte matiz, pero siempre lleva un mensaje y una marca distintos.
- **Amarillo de cultura y aviso** (`amarillo`, `amarillo-campo`, `amarillo-texto`): Cultura, selección inicial de la sopa y avisos de conexión. El texto siempre es oscuro.
- **Negro cálido de materiales** (`negro`, `negro-campo`, `negro-texto`): Materiales y acciones de PDF. Su campo se ve gris cálido; el negro pleno queda en el relieve, las franjas y la tinta.

### Neutral

- **Papel**: fondo general, tarjetas y sección Gramática; el borde distingue el blanco del resto del marco.
- **Papel hondo**: pie, citas, contenedores de guardado y estados neutros; no representa un botón por sí mismo.
- **Tinta**: títulos, lectura, enlaces editoriales y foco.
- **Tinta suave**: descripciones, ayuda, fuentes y metadatos.
- **Borde cálido**: divisores, contornos y relieve neutro.

Los tintes de tema son más pálidos que los campos de sección. Animales y La casa usan rojo; La familia, Números y Alimentos, amarillo; Colores y La naturaleza, verde. El amarillo de tema tiene su propio texto oscuro. Un tema desconocido usa la reserva neutra. El ícono y el nombre distinguen cada tema; el matiz agrupa.

**The Campo y texto Rule.** Cada campo y tinte usa su texto oscuro asignado; no se intercambian los papeles de campo, texto y color pleno.

**The Estado acompañado Rule.** Acierto, error y selección se explican con texto, ícono o una señal de forma; rojo y verde nunca son la única diferencia.

No existen escalas tonales normativas adicionales en el código. Las rampas del sidecar son solo muestras de paleta para el panel y no autorizan colores nuevos.

## Typography

**Display Font:** Charis SIL, con la pila de reserva del frontmatter.  
**Body Font:** Charis SIL. Las etiquetas usan la misma familia.

La familia contiene la `ẍ` y mantiene la palabra Mam legible en todos los papeles. Solo se cargan los archivos locales de 400 y 700; no se sintetizan pesos. La jerarquía usa tamaño, peso y color, sin una segunda familia. El tamaño base vive en `body`, de modo que los `rem` de la distribución conservan su referencia de navegador.

### Hierarchy

- **Display**: portada en tableta y escritorio; en teléfono baja a la escala headline.
- **Headline**: título interior desde tableta; en teléfono usa la escala word-card y un interlineado de 1.25.
- **Title**: títulos de sección y palabras de las filas del diccionario.
- **Word-card**: palabra Mam protagonista de cada entrada en tarjeta.
- **Translation**: equivalencia castellana y palabras Mam en las partidas.
- **Body**: cuerpo general; la lectura editorial usa el papel prose y se limita a 68ch.
- **Label**: ayuda, navegación superior, fuentes y metadatos.
- **Chip**: etiquetas y nombres de la barra inferior; el tamaño pequeño no reduce su objetivo táctil.

Los títulos se equilibran con `text-wrap: balance`; el cuerpo usa `pretty`. La prosa tiene títulos secundarios propios, listas convencionales y enlaces subrayados. No hay una razón modular única impuesta a la escala.

**The Mam exacto Rule.** El texto con `lang="mam"` se conserva tal como llega y no recibe `text-transform`; se desactivan sus ligaduras. Verificar `Ẍiky kyiẍ i’ẍ napẍ q’aq’ tx’otx’` al cambiar la fuente o su recorte.

## Layout

El marco compartido —encabezado y pie— y las páginas de panel alcanzan 1152 px. La variante de lectura alcanza 768 px; la prosa añade el límite de 68ch. El contenido centra su columna y deja relleno lateral de 16 px en teléfono y 24 px desde tableta; el relleno vertical del principal pasa de 32 a 40 px. La separación usa el ritmo de cuatro píxeles recogido en el frontmatter.

Por debajo de 768 px aparece la barra inferior fija con Inicio, Diccionario, Juegos y Más. Desde 768 px la sustituye la navegación superior con las seis secciones, capaz de envolver si falta espacio. Entre 768 y 1023 px el logotipo muestra solo la marca; desde 1024 px vuelve el nombre completo. «Más» enlaza a `#secciones` en el pie, sin menú dependiente de JavaScript. Las dos navegaciones nunca aparecen juntas.

La portada coloca los accesos de sección en dos columnas en teléfono y cuatro desde tableta. Los temas usan dos columnas y tres desde tableta; en escritorio la palabra del día ocupa una columna lateral de 320 px y queda adherida a 24 px del borde superior. No generalizar cuatro columnas de temas a la portada: su columna lateral ya consume ese ancho.

Las fichas de tema colocan el ícono sobre el nombre bajo 420 px y al lado desde ese ancho. Memoria usa dos columnas bajo 480 px y cuatro desde 480 px, con cartas de al menos 128 px. La sopa conserva casillas de 44–52 px y separación de 4 px; si el tablero no cabe, se desplaza dentro de su propia región, sin ensanchar la página. Desde 1024 px sus pistas pueden quedar al lado.

Los controles dedicados y las referencias a fuentes alcanzan al menos 44 px; las acciones principales suelen medir 48 px o más. Los enlaces dentro de la prosa y de una fila de texto conservan el flujo de lectura. En teléfono el cuerpo reserva `calc(4.25rem + env(safe-area-inset-bottom))` y el desplazamiento reserva `calc(5.25rem + env(safe-area-inset-bottom))`; desde tableta el relleno de desplazamiento inferior vuelve a 1rem. El margen superior de desplazamiento es 1rem.

## Elevation & Depth

El sistema combina fondos planos y relieve estructural en lo tocable. Una sombra inferior sin desenfoque señala que un control responde al dedo; las entradas, citas, fichas bibliográficas y avisos se leen sin sombra. No se traslada el relieve a toda tarjeta por su forma.

### Shadow Vocabulary

- **Control en reposo** (`box-shadow: 0 4px 0 var(--tocable-sombra, var(--color-borde))`): el color pleno del rumbo o el borde neutro.
- **Control pulsado** (`transform: translateY(4px)`; `box-shadow: 0 0 0 var(--tocable-sombra, var(--color-borde))`): confirma el toque sin alterar el flujo de la página.

El hundido y su sombra transicionan durante 80 ms con `ease-out`. Con movimiento reducido la transición desaparece y el hundido ocurre al instante. El acierto anima únicamente su ícono durante 320 ms, con un desplazamiento de −4 px al 45 %; con movimiento reducido esa animación no ocurre. No hay animaciones de entrada al desplazar la página.

**The Relieve tocable Rule.** El relieve pertenece a controles que lo usan como señal de interacción; una superficie que solo se lee permanece plana. La navegación, los chips y las casillas de sopa pueden ser interactivos sin llevar relieve.

## Shapes

Los botones y tarjetas principales comparten esquinas suaves de 16 px. Los cuadros de ícono y enlaces de navegación usan 12 px; las casillas de sopa y referencias a fuentes, 8 px. La búsqueda, las etiquetas y el indicador inferior activo usan píldora. El radio pequeño se reserva a elementos menores de prosa. Los contornos habituales son de uno o dos píxeles, sin cenefa ni borde dorado lateral en las citas.

El foco global dibuja un contorno de 3 px en tinta, separado 3 px del control. En el buscador, el contorno rodea la píldora entera mediante `focus-within`. El borde de una tarjeta no sustituye al foco.

## Components

### Buttons

Acciones físicas, legibles y de esquinas suaves. La recuperación de una página usa el campo verde; las acciones de juego, rojo; el guardado de lección, papel con borde; el PDF, campo negro cálido. Los botones principales usan negrita y altura mínima de 48 px. El estado hover del verde y rojo pasa a su tinte; el neutro y PDF pasan a papel hondo. Foco y pulsación siguen las reglas compartidas. Un control desactivado usa cursor normal; el guardado desactiva el relieve mientras trabaja y al terminar.

### Chips

El enlace de tema combina tinte, texto oscuro, punto del color pleno y nombre. Usa píldora, relleno lateral de 10 px y objetivo de 44 px de alto. Una etiqueta gramatical no interactiva usa relleno más pequeño y cursiva; no debe parecer una acción pendiente. Los enlaces dedicados a fuentes tienen 44 px por lado y nombre accesible; los enlaces integrados en una línea de prosa conservan el subrayado.

### Cards / Containers

La ficha de tema es un enlace completo sobre papel, con borde de dos píxeles, relleno de 12 px, altura mínima de 72 px e ícono en un cuadro de 48 px con tinte. Lleva relieve neutro. La entrada del diccionario es plana: tarjeta con borde y relleno de 16 px en listas por tema, o fila con divisor y relleno vertical de 12 px en listas por letra. Usa `dl`, `dt` y `dd`; no convertir el vocabulario completo en una rejilla de botones. Los resultados de búsqueda conservan el aspecto de la entrada en tarjeta.

### Inputs / Fields

El buscador real es una píldora de papel con borde verde de dos píxeles, lupa y campo de al menos 52 px de alto. Tiene etiqueta visible, texto de ayuda y foco en el envoltorio; el placeholder no sustituye a la etiqueta. El error de descarga usa amarillo claro y permite reintentar o navegar por letra y tema. La portada ofrece un enlace que dice «Buscar una palabra»; no imita un campo editable.

### Navigation

La sección activa combina campo de su matiz, negrita y `aria-current`. Gramática usa papel hondo con contorno interior para distinguirse del encabezado. La barra inferior muestra ícono y nombre; el ícono activo queda en una píldora clara. El encabezado permanece sobre papel con divisor; una franja de seis píxeles identifica las páginas interiores. `CabeceraSeccion` une enlace de vuelta de 44 px, ícono de 48 px y título; la portada y los estados sueltos no llevan franja.

### Juegos

Los mensajes compartidos combinan marca SVG y título: acierto en tinte verde, error en rojo y pista en amarillo pálido con su texto específico. Solo la marca de acierto rebota. Memoria muestra número y «Voltear» al inicio; las parejas encontradas quedan planas y salen de Tab. La sopa usa dos toques y un grafema Mam completo por casilla; un único punto de entrada de Tab y flechas, Inicio/Fin y Control permiten recorrerla. Al terminar o reiniciar, el foco acompaña el resultado o el tablero; la hidratación inicial no roba el foco. Sin JavaScript queda una lista para estudiar.

### Estados, guardado y lectura

`EstadoPagina` presenta ícono, título, explicación y salida verde al diccionario; distingue una dirección inexistente de una página aún no guardada. Los estados vacíos ofrecen una salida útil. El guardado de lección vive en un contenedor plano de papel hondo y solo aparece cuando hay imágenes propias: explica que los videos no se guardan, anuncia progreso mediante texto e ícono y permite reintentar. La acción lleva `aria-busy` mientras trabaja y reconoce las imágenes ya guardadas.

La prosa usa tinta, enlaces subrayados, listas reconocibles e imágenes elásticas con proporción reservada. Las citas usan papel hondo, relleno de 20 px y radio de 16 px, sin relieve. Los PDF conservan su ficha de fuente y distinguen «Abrir» externo de «Descargar» propio. El video espera una acción explícita tras una fachada neutra con control amarillo; el foco pasa al iframe o al aviso recuperable.

## Do's and Don'ts

### Do:

- **Do** mantener los pares de campo o tinte y texto del frontmatter.
- **Do** conservar el Mam exacto, con Charis SIL, `lang="mam"` y sin transformar mayúsculas.
- **Do** reservar el relieve para los controles que lo usan como señal táctil.
- **Do** acompañar los estados con texto y marcas, además del color.
- **Do** conservar el foco oscuro visible y espacio de desplazamiento para la barra inferior.
- **Do** mantener las acciones dedicadas en 44 px como mínimo y el tablero de sopa dentro de su región desplazable.
- **Do** respetar el movimiento reducido: hundido instantáneo y acierto sin animación.

### Don't:

- **Don't** usar blanco sobre amarillo ni amarillo como texto sobre papel.
- **Don't** usar rojo y verde como única diferencia entre error y acierto.
- **Don't** añadir una segunda familia o pesos sintéticos para crear jerarquía.
- **Don't** extender el color pleno a grandes fondos ni recuperar la cenefa y el borde dorado retirados.
- **Don't** explicar el significado cultural de los rumbos antes de validarlo con la comunidad.
- **Don't** presentar muestras de desarrollo como contenido público ni documentar un tema oscuro que aún no existe.

Fuente de verdad de esta extracción: `src/styles/global.css`, `BaseLayout`, navegación, cabeceras, fichas, buscador, juegos, estados, guardado y prosa implementados. El sidecar extiende estos tokens con comportamiento y ejemplos autónomos; sus vistas son documentación, no una biblioteca adicional para producción.
