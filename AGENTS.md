# AGENTS.md

## Contexto del proyecto

Proyecto de landing scrollytelling basado en `comic.pdf`, con narrativa visual tipo comic, animaciones por scroll y assets separados por slide.

- Stack: `HTML + CSS + JS` vanilla.
- Animación: `GSAP` + `ScrollTrigger` vía CDN.
- Estilo de tipografía general: `Courier New`.
- Color naranja base acordado: `#FFB30B`.
- Idioma del contenido: español.

## Estructura de archivos

- `index.html`: estructura de slides y carga de scripts.
- `styles/main.css`: estilos globales, grillas por slide, responsive.
- `scripts/main.js`: animaciones de entrada/parallax/typewriter.
- `assets/SVG/`: assets principales por slide (fuente de verdad actual).
- `assets/pages/`: assets legacy/prototipo (aun presentes, no todos en uso).
- `assets/font/`: carpeta de tipografía exportada (actualmente solo demo y css).

## Estado actual (importante)

Actualmente `index.html` tiene **solo el slide 1 montado**:

- `#page-01` con:
  - `assets/SVG/slide-1-titulo.svg`
  - `assets/SVG/slide-1-shape.svg`
  - fondo visual configurado como negro desde CSS.

Sin embargo, `styles/main.css` y `scripts/main.js` conservan configuración para slides `#page-02` a `#page-05` (y bloques antiguos hasta `#page-13`) del flujo previo.

### Implicación para futuros cambios

- Si se retoma una landing multi-slide, reutilizar reglas existentes de `#page-02` a `#page-05`.
- Si el proyecto queda solo en slide 1, conviene limpiar CSS/JS no usado para evitar deuda técnica.

## Convenciones visuales y de layout usadas

- Slides de comic con “aire” blanco alrededor en composiciones de grilla:
  - `padding: 1.4vw` desktop.
  - `padding: 1.2rem` en tablet/móvil.
- Grillas implementadas:
  - `page03-grid`: 4 viñetas (hero + strip/main + side).
  - `page05-grid`: 3 viñetas (top + main + side).
- Para slides en negro pleno o naranja plano se anula/deja de usar `scene__bg` cuando hace falta.

## Animaciones existentes en JS

- Entrada general de `.layer--shape` y `.layer--text` por scroll.
- Fade/salida suave del texto al abandonar cada scene.
- Slide 2 (si existe en HTML):
  - parallax diferencial shape/texto,
  - typewriter para el texto `I - Del inicio de todas las historias`.
- Textos narrativos (cuando corresponde):
  - aplicar `data-typewriter` en el elemento (ej. `p`) para que al entrar en viewport se escriba con efecto máquina de escribir.
- Entradas por cards para:
  - `#page-03 .page03-card`
  - `#page-05 .page05-card`

## Assets disponibles por slide

- Slide 1:
  - `assets/SVG/slide-1-titulo.svg`
  - `assets/SVG/slide-1-shape.svg`
- Slide 2:
  - `assets/SVG/slide-2-shape.svg`
- Slide 3:
  - `assets/SVG/slide-3-1.svg`
  - `assets/SVG/slide-3-2.svg`
  - `assets/SVG/slide-3-3.svg`
  - `assets/SVG/slide-3-4.svg`
- Slide 4:
  - `assets/SVG/slide-4-1.svg`
- Slide 5:
  - `assets/SVG/slide-5-1.svg`
  - `assets/SVG/slide-5-2.svg`
  - `assets/SVG/slide-5-3.svg`

## Fuentes

Hay archivos en `assets/font/` pero falta confirmar binarios reales (`.woff/.woff2`) para carga por `@font-face`.  
El CSS de esa carpeta existe (`assets/font/stylesheet.css`), pero su `font-family` está vacío en el export actual.

## Reglas prácticas para próximos agentes

1. No asumir que el estado actual es el mismo que el histórico: revisar `index.html` primero.
2. Si se agrega un slide nuevo, crear:
   - bloque HTML del slide,
   - namespace CSS por id (`#page-0X ...`),
   - animación específica en `scripts/main.js` solo si suma.
3. Mantener texto como texto HTML cuando aplique; usar SVG/PNG para elementos vectoriales/ilustración.
4. Evitar romper el ratio visual de las viñetas: preferir `object-fit: cover` y ajustar por grid-areas.
5. Correr verificación de lint tras cambios en `index.html`, `styles/main.css`, `scripts/main.js`.

## Próximo paso recomendado

Definir si el entregable final será:

- **A)** solo hero/slide 1 (versión reducida), o
- **B)** narrativa multi-slide (restaurar slides 2-5+ en `index.html` usando estructura ya preparada).
