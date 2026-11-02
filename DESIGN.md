---
name: Biblioteca Digital Mam
description: Biblioteca Mam con paleta cálida clara u oscura, lectura amplia y controles que responden al toque.
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
  marca-papel: "#fffdf8"
  marca-hoja: "#e6dfd4"
  oscuro-papel: "#201d19"
  oscuro-papel-hondo: "#2a251f"
  oscuro-tinta: "#f5ecde"
  oscuro-tinta-suave: "#c9bcaa"
  oscuro-borde: "#655a4b"
  oscuro-verde: "#69c98c"
  oscuro-verde-campo: "#254832"
  oscuro-verde-texto: "#c4efd1"
  oscuro-rojo: "#f0847b"
  oscuro-rojo-campo: "#5b302c"
  oscuro-rojo-texto: "#ffdbd5"
  oscuro-amarillo: "#dfb94e"
  oscuro-amarillo-campo: "#51421f"
  oscuro-amarillo-texto: "#fae5ab"
  oscuro-negro: "#c3b39a"
  oscuro-negro-campo: "#3a3229"
  oscuro-negro-texto: "#eee3d3"
  oscuro-rojo-tinte: "#382622"
  oscuro-amarillo-tinte: "#3b3220"
  oscuro-amarillo-tinte-texto: "#efcf80"
  oscuro-verde-tinte: "#25382b"
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

# Design System: Biblioteca Digital Mam

## Overview

**Creative North Star: "Los cuatro rumbos con lenguaje de app"**

La Biblioteca Digital Mam organiza palabras con campos definidos, nombres legibles e íconos constantes. La tonalidad aprobada, «B2 · Claro», mantiene el fondo cálido y reserva los colores plenos para marcas pequeñas, franjas de sección y el relieve de los controles. Su extensión oscura conserva esos papeles sobre neutros cálidos oscuros; no establece otro mundo visual. La interfaz sirve a estudiantes de primaria y básicos que leen despacio y a docentes que preparan clase; su claridad no depende de adornos ni de una conexión estable.

La palabra en Mam tiene prioridad: se conserva exacta, con sus grafemas completos y una sola familia tipográfica. Las superficies de lectura permanecen planas; los controles con relieve se hunden al pulsarlos. Este documento registra el sistema claro de la Fase 7 y su extensión oscura implementada en la Fase 8. La composición, la tipografía, los radios y el relieve son comunes a ambas apariencias. «Los cuatro rumbos» nombra la dirección visual aprobada; su interpretación cultural requiere validación comunitaria antes de explicarse en la interfaz.

**Key Characteristics:**

- Campos y textos emparejados del mismo matiz, claros u oscuros según la apariencia.
- Charis SIL como única familia, con pesos reales 400 y 700.
- Relieve táctil reservado a controles y lectura sobre superficies planas.
- Orientación por nombre, ícono y estado, además del color.
- Teléfono primero, navegación sin JavaScript y contenido utilizable sin señal.

## Colors

La paleta reúne neutros cálidos, verde de búsqueda y campos rojo, amarillo y gris cálido para las secciones. Los valores normativos están en el frontmatter y corresponden a las propiedades de `src/styles/global.css`. Los nombres sin prefijo registran la base clara; `oscuro-` registra el valor del mismo papel en la variante oscura (por ejemplo, `oscuro-papel` corresponde al override de `--color-papel`). `marca-papel` y `marca-hoja` son materiales invariantes del logotipo.

### Primary

- **Verde de búsqueda** (`verde`, `verde-campo`, `verde-texto`): diccionario, acción principal de recuperación y sección activa. El campo recibe su texto verde asignado, oscuro en claro y luminoso en oscuro; el verde pleno sostiene el relieve y detalles de marca.

### Secondary

- **Rojo de juegos** (`rojo`, `rojo-campo`, `rojo-texto`): acceso a juegos y acciones de partida. El error comparte matiz, pero siempre lleva un mensaje y una marca distintos.
- **Amarillo de cultura y aviso** (`amarillo`, `amarillo-campo`, `amarillo-texto`): Cultura, selección inicial de la sopa y avisos de conexión. El campo y el aviso reciben su texto asignado: oscuro en claro y luminoso en oscuro.
- **Negro cálido de materiales** (`negro`, `negro-campo`, `negro-texto`): Materiales y acciones de PDF. Su campo se ve gris cálido; en oscuro pasa a marrón oscuro con texto claro y un pleno neutro luminoso para relieve y franjas.

### Neutral

- **Papel**: fondo general, tarjetas y sección Gramática; el borde distingue el blanco del resto del marco.
- **Papel hondo**: pie, citas, contenedores de guardado y estados neutros; no representa un botón por sí mismo.
- **Tinta**: títulos, lectura, enlaces editoriales y foco.
- **Tinta suave**: descripciones, ayuda, fuentes y metadatos.
- **Borde cálido**: divisores, contornos y relieve neutro.

En claro, los tintes de tema son más pálidos que los campos de sección; en oscuro son superficies más hondas del mismo matiz. Animales y La casa usan rojo; La familia, Números y Alimentos, amarillo; Colores y La naturaleza, verde. El amarillo de tema tiene su propio texto asignado en cada apariencia. Un tema desconocido usa la reserva neutra. El ícono y el nombre distinguen cada tema; el matiz agrupa.

**The Campo y texto Rule.** Cada campo y tinte usa el texto asignado por su apariencia; no se intercambian los papeles de campo, texto y color pleno.

**The Estado acompañado Rule.** Acierto, error y selección se explican con texto, ícono o una señal de forma; rojo y verde nunca son la única diferencia.

La variante oscura sustituye los 21 papeles del sistema tanto con la elección explícita como mediante `prefers-color-scheme: dark` sin JavaScript. La nieve y las hojas del logotipo conservan `marca-papel` y `marca-hoja`; sus otros colores siguen los plenos de la apariencia. Las imágenes y los videos conservan sus colores originales, sin filtros ni inversión.

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

Por debajo de 768 px aparece la barra inferior fija con Inicio, Diccionario, Juegos y Más. Desde 768 px la sustituye la navegación superior con las seis secciones, capaz de envolver si falta espacio. Entre 768 y 1023 px el logotipo muestra solo la marca; desde 1024 px vuelve el nombre completo. «Más» enlaza a `#secciones` en el pie, sin menú dependiente de JavaScript. Las dos navegaciones nunca aparecen juntas. El encabezado conserva la marca sin encoger a la izquierda y el botón de apariencia a la derecha en todos los tamaños, con separación de 12 px entre sus elementos. La acción del botón añade texto desde 1280 px; por debajo mantiene el ícono y su nombre accesible.

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

El foco global dibuja un contorno de 3 px en la tinta de la apariencia, oscura en claro y luminosa en oscuro, separado 3 px del control. En el buscador, el contorno rodea la píldora entera mediante `focus-within`. El borde de una tarjeta no sustituye al foco.

## Components

### Buttons

Acciones físicas, legibles y de esquinas suaves. La recuperación de una página usa el campo verde; las acciones de juego, rojo; el guardado de lección, papel con borde; el PDF, campo negro cálido. Los botones principales usan negrita y altura mínima de 48 px. El estado hover del verde y rojo pasa a su tinte; el neutro y PDF pasan a papel hondo. Foco y pulsación siguen las reglas compartidas. Un control desactivado usa cursor normal; el guardado desactiva el relieve mientras trabaja y al terminar.

### Chips

El enlace de tema combina tinte, texto asignado, punto del color pleno y nombre. Usa píldora, relleno lateral de 10 px y objetivo de 44 px de alto. Una etiqueta gramatical no interactiva usa relleno más pequeño y cursiva; no debe parecer una acción pendiente. Los enlaces dedicados a fuentes tienen 44 px por lado y nombre accesible; los enlaces integrados en una línea de prosa conservan el subrayado.

### Cards / Containers

La ficha de tema es un enlace completo sobre papel, con borde de dos píxeles, relleno de 12 px, altura mínima de 72 px e ícono en un cuadro de 48 px con tinte. Lleva relieve neutro. La entrada del diccionario es plana: tarjeta con borde y relleno de 16 px en listas por tema, o fila con divisor y relleno vertical de 12 px en listas por letra. Usa `dl`, `dt` y `dd`; no convertir el vocabulario completo en una rejilla de botones. Los resultados de búsqueda conservan el aspecto de la entrada en tarjeta.

### Inputs / Fields

El buscador real es una píldora de papel con borde verde de dos píxeles, lupa y campo de al menos 52 px de alto. Tiene etiqueta visible, texto de ayuda y foco en el envoltorio; el placeholder no sustituye a la etiqueta. El error de descarga usa el campo amarillo de la apariencia y permite reintentar o navegar por letra y tema. La portada ofrece un enlace que dice «Buscar una palabra»; no imita un campo editable.

### Navigation

La sección activa combina campo de su matiz, negrita y `aria-current`. Gramática usa papel hondo con contorno interior para distinguirse del encabezado. La barra inferior muestra ícono y nombre; el ícono activo queda en una píldora del campo de su sección. El encabezado permanece sobre papel con divisor; una franja de seis píxeles identifica las páginas interiores. `CabeceraSeccion` une enlace de vuelta de 44 px, ícono de 48 px y título; la portada y los estados sueltos no llevan franja.

El pie reúne las seis secciones en dos columnas, tres desde 768 px y seis desde 1024 px. Sus controles colocan el ícono sobre el nombre y centran el texto bajo 420 px; desde 420 px usan una fila y alineación izquierda. El nombre completo se conserva en su propio elemento, sin abreviarlo ni reducir su letra para encajarlo.

### Juegos

Los mensajes compartidos combinan marca SVG y título: acierto en tinte verde, error en rojo y pista en tinte amarillo con su texto específico. Solo la marca de acierto rebota. Memoria muestra número y «Voltear» al inicio; las parejas encontradas quedan planas y salen de Tab. La sopa usa dos toques y un grafema Mam completo por casilla; un único punto de entrada de Tab y flechas, Inicio/Fin y Control permiten recorrerla. Al terminar o reiniciar, el foco acompaña el resultado o el tablero; la hidratación inicial no roba el foco. Sin JavaScript queda una lista para estudiar.

### Estados, guardado y lectura

`EstadoPagina` presenta ícono, título, explicación y salida verde al diccionario; distingue una dirección inexistente de una página aún no guardada. Los estados vacíos ofrecen una salida útil. El guardado de lección vive en un contenedor plano de papel hondo y solo aparece cuando hay imágenes propias: explica que los videos no se guardan, anuncia progreso mediante texto e ícono y permite reintentar. La acción lleva `aria-busy` mientras trabaja y reconoce las imágenes ya guardadas.

La prosa usa tinta, enlaces subrayados, listas reconocibles e imágenes elásticas con proporción reservada. Las citas usan papel hondo, relleno de 20 px y radio de 16 px, sin relieve. Los PDF conservan su ficha de fuente y distinguen «Abrir» externo de «Descargar» propio. El video espera una acción explícita tras una fachada neutra con control amarillo; el foco pasa al iframe o al aviso recuperable.

### Apariencia

El encabezado ofrece el único control manual de apariencia: un botón visible con sol o luna que anuncia la apariencia a la que cambiará. Su nombre accesible y título dicen «Cambiar a claro» o «Cambiar a oscuro»; desde 1280 px también muestra «Claro» u «Oscuro» junto al ícono. Usa al menos 44 px por lado, radio de 12 px, papel hondo y tinta, con campo negro cálido al pasar el puntero, foco compartido y relieve neutro. Al pulsarlo, invierte la apariencia efectiva y guarda una elección explícita. Los clics sobre el SVG activan el mismo botón.

La apariencia sigue el dispositivo mientras no haya una elección manual guardada; esa elección prevalece y se recuerda localmente en este navegador. Se aplica desde la cabecera antes del CSS y cambia sin transición; también sincroniza otras pestañas y el regreso desde la caché de navegación. Si no se puede guardar, el cambio sigue funcionando localmente en la página. El pie enlaza las seis secciones y continúa con los créditos, sin selector de apariencia ni su ayuda. No hay un control para restablecer el modo automático.

Sin JavaScript, el botón del encabezado permanece oculto y el pie conserva una explicación de que se sigue la configuración del dispositivo; el respaldo de CSS mantiene la variante automática. El documento anuncia `color-scheme: light dark`; los dos `theme-color` responden al sistema sin guiones y se actualizan con la elección manual cuando hay JavaScript. El manifiesto y los iconos instalados conservan deliberadamente su versión clara: no hay splash dinámico ni se promete que la ventana instalada cambie su pantalla de arranque.

## Do's and Don'ts

### Do:

- **Do** mantener los pares de campo o tinte y texto del frontmatter.
- **Do** conservar el Mam exacto, con Charis SIL, `lang="mam"` y sin transformar mayúsculas.
- **Do** reservar el relieve para los controles que lo usan como señal táctil.
- **Do** acompañar los estados con texto y marcas, además del color.
- **Do** conservar el foco de tinta visible en ambas apariencias y espacio de desplazamiento para la barra inferior.
- **Do** mantener las acciones dedicadas en 44 px como mínimo y el tablero de sopa dentro de su región desplazable.
- **Do** respetar el movimiento reducido: hundido instantáneo y acierto sin animación.
- **Do** seguir la apariencia del dispositivo hasta una elección manual y conservar los mismos papeles semánticos al cambiar de apariencia.

### Don't:

- **Don't** usar blanco sobre el amarillo claro ni amarillo pleno como texto sobre papel claro; en oscuro se usan los pares específicos del frontmatter.
- **Don't** usar rojo y verde como única diferencia entre error y acierto.
- **Don't** añadir una segunda familia o pesos sintéticos para crear jerarquía.
- **Don't** extender el color pleno a grandes fondos ni recuperar la cenefa y el borde dorado retirados.
- **Don't** explicar el significado cultural de los rumbos antes de validarlo con la comunidad.
- **Don't** presentar muestras de desarrollo como contenido público.
- **Don't** invertir imágenes o videos, oscurecer la nieve y las hojas de la marca ni añadir una transición al cambiar de apariencia.

Fuente de verdad de esta extracción: `src/styles/global.css`, `src/scripts/apariencia.js`, `BaseLayout`, `SiteHeader`, `SiteFooter`, `Logo`, navegación, cabeceras, fichas, buscador, juegos, estados, guardado y prosa implementados; `tests/apariencia.test.ts` comprueba persistencia, sincronización y concordancia de paletas. El sidecar extiende estos tokens con comportamiento y ejemplos autónomos; sus vistas son documentación, no una biblioteca adicional para producción.
