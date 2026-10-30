# Rediseño de la UI

Decisiones tomadas entre el 29 de octubre de 2026 y el inicio de la Fase 0. Este documento se
actualiza a medida que las fases cierran: si un retoque cambia una decisión, se corrige aquí
y no solo en el código.

La verdad del producto (público, restricciones, accesibilidad) vive en [`PRODUCT.md`](../PRODUCT.md).
El sistema visual terminado se documentará en `DESIGN.md` al cerrar la Fase 7.

Bocetos de referencia (no se publican, solo sirven para comparar):

- `.impeccable/mocks/decision/fusion.html` — portada en teléfono, la base aprobada.
- `.impeccable/mocks/decision/fusion-responsiva.html` — la misma portada en teléfono, tableta y
  escritorio.
- `canon.html` y `model-pick.html` en la misma carpeta — las dos direcciones que se fusionaron.

## La dirección: «los cuatro rumbos» con lenguaje de app

Es un **rediseño**, no una evolución: la dirección B+C de agosto (banda jade, oro, cenefa del
huipil) queda como referencia de lo que funcionó y se reemplaza.

- **Estructura (de «los cuatro rumbos»):** los colores de la paleta tienen significado. Verde es
  el centro, donde vive el diccionario y el buscador; rojo, amarillo, blanco y negro son los
  cuatro rumbos y cada uno lleva una sección. Cada rumbo muestra su palabra de color en Mam
  (*kyeq*, *q’an*, *saq*, *q’eq*), tomada del vocabulario real.
- **Lenguaje visual (de la app educativa estándar):** fondo blanco, tarjetas con radio de 16 px,
  colores vivos, y una sombra inferior de 4 px que hace que lo tocable parezca un botón físico.
- **Validación cultural pendiente:** la lectura de la paleta como rumbos mayas tiene que
  confirmarla alguien de la comunidad o el validador lingüístico antes de afirmarla como dato
  en la interfaz (por ejemplo, en una página que explique los colores). Mientras tanto la
  paleta se usa sin texto que la explique.

## Paleta

**Tonalidad elegida (29-oct-2026): «B2 · Claro».** Se compararon tres tonos (vivo, intermedio,
profundo) y el intermedio se suavizó de dos maneras (apagado y claro). Ganó la clara: los
rumbos y el buscador son **campos claros con texto oscuro de su mismo color**, y el color fuerte
queda solo en la sombra inferior del botón. Comparaciones en
`.impeccable/mocks/decision/tonos.html` y `tonos-suaves.html`.

| Papel | Campo (claro) | Texto encima | Color fuerte (sombra, ícono, logo) |
|---|---|---|---|
| Verde (centro) | `#cfe8d6` | `#0b5228` (7.18:1) | `#12773a` |
| Rojo (oriente) | `#f6d3cd` | `#8e1c1c` (6.48:1) | `#c62828` |
| Amarillo (sur) | `#f8e3a3` | `#5c4100` (7.47:1) | `#d9a404` |
| Negro (poniente) | `#e6dfd4` | `#262019` (12.18:1) | `#262019` |
| Blanco (norte) | `#fffdf8` con borde `#ece5d8` | `#262019` | `#ece5d8` |

| Neutro | Valor | Uso |
|---|---|---|
| Fondo | `#fffdf8` | Fondo general, apenas cálido |
| Tinta | `#262019` | Texto (15.9:1 sobre el fondo) |
| Tinta suave | `#5b5348` | Descripciones y metadatos (7.44:1; ≥ 5.4:1 sobre cualquier campo claro) |
| Borde | `#ece5d8` | Bordes y sombra de lo neutro |

Consecuencia aceptada: el rumbo negro (*q’eq*) se ve como gris cálido en su campo; el negro
pleno queda en la sombra y en el logotipo.

Cualquier tono nuevo se mide antes de adoptarlo; ninguno puede bajar de AA.

**Reglas fijas:**

- Sobre amarillo, siempre tinta oscura. Nunca texto blanco sobre amarillo ni texto amarillo
  sobre blanco.
- Nunca rojo frente a verde como única señal (daltonismo): siempre con ícono y texto. Aplica
  sobre todo a «correcto / incorrecto» en los juegos.
- La sombra de botón solo va en lo que se toca. Lo que solo se lee va plano.

### Secciones

| Sección | Color |
|---|---|
| Diccionario y buscador | Verde (centro) |
| Juegos | Rojo |
| Cultura | Amarillo |
| Gramática | Blanco con borde |
| Materiales | Negro |
| Base legal | Sin color propio, dentro de «Más» |

### Temas del vocabulario

Cada tema lleva un fondo tinte de su grupo y su **ícono propio en el tono fuerte**. El ícono
distingue al tema; el color solo agrupa.

| Grupo | Tinte / tono | Temas |
|---|---|---|
| Rojo | `#fbe4e1` / `#8e1c1c` (7.41:1) | Animales, La casa |
| Amarillo | `#fdf3cf` / `#7a5603` (5.98:1) | La familia, Números, Alimentos |
| Verde | `#ddf1e2` / `#0b5228` (7.88:1) | Colores, La naturaleza |

Los tintes de tema son más pálidos que los campos de los rumbos, para que una tarjeta de tema
no se confunda con un botón de sección.

Un tema nuevo que llegue del backend entra en uno de los tres grupos; el mapa sigue en
`src/data/temas.ts`, con su caso neutro.

## Tipografía

- **Charis SIL como única familia**, también en títulos. Es la que garantiza la `ẍ` (U+1E8D);
  una segunda familia rompe el presupuesto. La jerarquía se hace con peso, tamaño y color.
- Base de 18 px. El texto de lectura tiene un solo tamaño y se limita a ~68 caracteres de ancho.
- El texto en Mam nunca se transforma (`text-transform` prohibido sobre él). Prueba de
  aceptación: `Ẍiky kyiẍ i’ẍ napẍ q’aq’ tx’otx’`.

## Íconos, imágenes y logotipo

- Solo íconos SVG lineales en línea, uno por tema y por sección. Sin paquetes de iconos ni
  imágenes de stock.
- Las tarjetas dejan el hueco preparado para ilustraciones propias por si llegan después.
- **Logotipo nuevo en SVG** (`src/components/Logo.astro`), elegido el 29-oct-2026: **volcán y
  libro**, variante «tapa roja en abanico». El volcán con nieve y el sol del logo anterior, sobre
  un libro abierto de dos capas de hojas sin contorno, encima de una tapa roja; al lado,
  «Aprende**Mam**» con «Mam» en verde. Se descartaron los cuatro rombos de los rumbos, la ẍ en
  burbuja, el brote, la insignia circular y el rombo del tejido
  (`.impeccable/mocks/decision/logos.html`), y los libros de tapa verde y con lomo
  (`logo-libros.html`).

## Responsivo (mobile first, Tailwind)

| Ancho | Navegación | Rumbos | Temas | Extra |
|---|---|---|---|---|
| Teléfono `< 768` | Barra inferior: Inicio, Diccionario, Juegos, Más | 2 × 2 | 2 columnas | — |
| Tableta `md ≥ 768` | Barra superior con las seis secciones | 1 fila de 4 | 3 columnas | — |
| Escritorio `lg ≥ 1024` | Barra superior | 1 fila de 4 | 4 columnas | Columna lateral fija con la palabra del día |

Nunca las dos navegaciones a la vez. Contenido limitado a 1120 px de ancho. Objetivos táctiles
de 44 px como mínimo.

## Páginas interiores

- Cada sección hereda su color de rumbo en una **franja superior de 6 px** y en el ícono del
  título. El fondo sigue blanco; nada de encabezados de color a pantalla completa.
- Entrada del diccionario: tarjeta blanca con la palabra en Mam grande, el castellano debajo, y
  clase gramatical y tema como etiquetas con el tinte del tema. En las páginas de letra sigue
  siendo fila, no tarjeta (puede haber cientos seguidas).

## Palabra del día

Se elige **por fecha en el navegador**, con unas ~15 líneas de JS en línea y una lista corta
incrustada (~1 KB). Cambia cada día aunque no se publique nada. Sin JS se ve la que se eligió al
compilar. No es una isla de React.

## Movimiento

- Al pulsar, lo tocable se hunde 4 px en 80 ms.
- En los juegos, una celebración breve al acertar (rebote del ícono, < 400 ms).
- Nada de animaciones al hacer scroll. Todo se desactiva con `prefers-reduced-motion`.

## Fases

Cada fase se valida en el navegador (teléfono, tableta y escritorio) antes de pasar a la
siguiente. Los retoques que surjan se anotan en este documento.

- [ ] **Fase 0 — Fundamentos.** Cerrar la tonalidad de la paleta con una página de comparación;
  tokens en `@theme` de `src/styles/global.css`; tipografía; foco; sombra de botón y su
  hundido; logotipo SVG nuevo.
  - Hecho (pendiente de tu visto bueno): tonalidad B2; tokens nuevos en `global.css` junto a los
    viejos (los neutros `papel`, `tinta`, `tinta-suave` y `borde` ya tienen los valores nuevos);
    cuerpo a 18 px; foco de 3 px en tinta; selección y cursor de la paleta; utilidad `tocable`
    con sombra y hundido; `src/components/Logo.astro`. Muestrario en `/prueba-fundamentos`
    (fuera del sitemap y del precache; se borra en la Fase 7).
- [ ] **Fase 1 — Armazón.** Encabezado, navegación superior y barra inferior, pie, aviso sin
  conexión (`BaseLayout`, `SiteHeader`, `MainNav`, `SiteFooter`). Incluye regenerar el favicon,
  los íconos de la PWA (`public/icon-*.png`, `apple-touch-icon.png`) y el color del manifiesto
  con el logotipo nuevo; `public/logo.webp` deja de usarse.
- [ ] **Fase 2 — Portada.** Buscador-enlace, los cuatro rumbos, temas, palabra del día.
- [ ] **Fase 3 — Diccionario.** Buscador (isla), tarjeta y fila de entrada, páginas de letra y de
  tema, índice alfabético.
- [ ] **Fase 4 — Juegos.** Índice y los tres juegos; correcto/incorrecto con ícono y texto.
- [ ] **Fase 5 — Editorial.** Cultura, gramática, base legal, materiales, prosa y el contenedor
  de video. La cita de `.prosa blockquote` lleva un borde izquierdo de 4 px en oro que el
  detector de impeccable marca como tic de diseño; se replantea aquí.
- [ ] **Fase 6 — Estados especiales.** 404, sin conexión, secciones vacías, descarga de lección.
- [ ] **Fase 7 — Cierre.** Auditoría de accesibilidad y peso (< 150 KB), pulido, `DESIGN.md`.
- [ ] **Fase 8 — Tema oscuro.** Variante oscura de todos los tokens, con contraste medido de nuevo.
