---
name: REGALIA
description: Marketplace local para regalos personalizados, reservas con seña y tiendas verificadas.
colors:
  oxblood: "#5a2440"
  oxblood-deep: "#3b172c"
  antique-gold: "#d7ad4b"
  warm-rose: "#c95f51"
  ink: "#231927"
  muted: "#746879"
  paper: "#fbf5ef"
  paper-elevated: "#fffaf5"
  surface: "#ffffff"
  surface-soft: "#f7eee7"
  border: "#eadbd0"
  success: "#2f735f"
typography:
  display:
    fontFamily: "Georgia, Times New Roman, serif"
    fontSize: "clamp(3rem, 5.5vw, 5.8rem)"
    fontWeight: 700
    lineHeight: 0.92
    letterSpacing: "-0.055em"
  headline:
    fontFamily: "Georgia, Times New Roman, serif"
    fontSize: "clamp(2rem, 3.6vw, 3.4rem)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.045em"
  body:
    fontFamily: "Segoe UI Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Segoe UI Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "0.72rem"
    fontWeight: 950
    lineHeight: 1.2
    letterSpacing: "0.13em"
rounded:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "20px"
  xl: "28px"
  pill: "999px"
spacing:
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "3rem"
components:
  button-primary:
    backgroundColor: "{colors.oxblood}"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
    padding: "0.72rem 1rem"
    height: "2.75rem"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.oxblood}"
    rounded: "{rounded.pill}"
    padding: "0.72rem 1rem"
    height: "2.75rem"
  field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "15px"
    padding: "0.75rem 0.9rem"
    height: "3rem"
---

# Design System: REGALIA

## Overview

**Creative North Star: "El atelier editorial del regalo local"**

REGALIA se expresa como una casa curadora: cálida, precisa y cercana, con la pausa de una
papelería fina y la claridad de un catálogo contemporáneo. La identidad existente combina vino
profundo, dorado antiguo y superficies de papel para hacer que elegir un regalo se sienta personal
sin volver difícil la decisión.

La composición alterna una imagen protagonista, franjas editoriales y superficies planas. La
expresión está en la tipografía serif de los titulares, los cortes geométricos inspirados en
empaque y una jerarquía que lleva de intención a catálogo, tienda y reserva. El contenido real,
la disponibilidad y las condiciones de cada tienda deben ganar siempre a la decoración.

**Key Characteristics:**

- Curaduría local con calidez editorial.
- Contraste vino/dorado usado con intención, no como ornamento constante.
- Papel cálido, líneas finas y ritmo de catálogo.
- Interacciones claras, táctiles y accesibles.

## Colors

La paleta es un vino sobrio sobre papel cálido, con dorado como señal de atención y rosa como
acento humano. Los colores semánticos mantienen significado constante entre superficies públicas
y privadas.

### Primary

- **Vino REGALIA** (`#5a2440`): navegación activa, acciones principales, hero y superficies de
  decisión.
- **Vino profundo** (`#3b172c`): fondos de alto contraste y estados de énfasis.

### Secondary

- **Dorado antiguo** (`#d7ad4b`): líneas de cinta, foco, disponibilidad destacada y señales de
  ocasión.
- **Rosa cálido** (`#c95f51`): badges, alertas suaves y acentos de celebración.

### Neutral

- **Tinta ciruela** (`#231927`): texto principal.
- **Texto apagado** (`#746879`): descripción y metadatos secundarios.
- **Papel REGALIA** (`#fbf5ef`): canvas principal.
- **Papel elevado** (`#fffaf5`): shell público y superficies de descanso.
- **Superficie blanca** (`#ffffff`): formularios, tarjetas y controles.
- **Superficie suave** (`#f7eee7`): hover y agrupaciones ligeras.
- **Línea de papel** (`#eadbd0`): divisores y bordes discretos.
- **Verde confianza** (`#2f735f`): confirmación y disponibilidad positiva.

### Named Rules

**The Gold-as-Signal Rule.** El dorado guía una decisión o marca una transición; no rellena cada
componente ni compite con los productos.

En superficies claras, las etiquetas y contornos de foco usan vino profundo para conservar
contraste; el dorado queda como halo, línea o señal sobre fondos oscuros.

## Typography

**Display Font:** Georgia (with Times New Roman, serif fallback)

**Body Font:** Segoe UI Variable (with Segoe UI, system-ui fallback)

**Character:** La serif aporta memoria y regalo; la sans-serif mantiene búsqueda, precio y estado
legibles en pantallas pequeñas.

### Hierarchy

- **Display** (700, `clamp(3rem, 5.5vw, 5.8rem)`, `0.92`): tesis del inicio y mensajes de alto
  impacto.
- **Headline** (700, `clamp(2rem, 3.6vw, 3.4rem)`, `1`): títulos de secciones y paneles.
- **Title** (950, alrededor de `1.05rem`, `1.2`): nombre de producto, tienda o recurso.
- **Body** (400, `1rem`, `1.6`): explicación y copy de decisión; mantener medidas cómodas de
  65–75ch cuando el contenedor lo permita.
- **Label** (950, `0.72rem`, `0.13em`, mayúsculas): categorías, contexto y metadatos breves.

### Named Rules

**The Serif-for-Meaning Rule.** La serif comunica ocasión y selección; la sans-serif comunica
acción, precio, estado y navegación.

## Layout

Las superficies públicas usan un contenedor editorial de aproximadamente 1180px y un ancho fluido
con márgenes mínimos de 1rem. El inicio alterna un hero de dos columnas en escritorio, franjas de
intención, rejillas de catálogo y rails de información. En tablet se reduce a una columna y en
móvil se priorizan dos columnas para exploración, una columna para productos y controles de al menos
44px de alto.

Los divisores finos marcan cambios de grupo; el espacio superior de los titulares supera el espacio
inferior para preservar ritmo. Las áreas privadas pueden usar una densidad mayor, pero heredan la
misma paleta, tipografía y foco visible.

## Elevation & Depth

REGALIA usa un híbrido contenido: superficies editoriales planas y líneas de papel para estructura,
con sombras ambientales solo cuando una tarjeta, formulario o acción debe separarse del canvas. La
profundidad nunca sustituye a la jerarquía ni convierte cada bloque en una tarjeta flotante.

### Shadow Vocabulary

- **Ambient soft** (`0 18px 44px rgba(35, 25, 39, 0.1)`): hero, formularios y superficies de
  decisión.
- **Elevated** (`0 28px 80px rgba(35, 25, 39, 0.14)`): separación amplia del hero principal y
  superficies protagonistas (`--rg-shadow-elevated`).
- **Interactive elevated** (`0 18px 46px rgba(61, 24, 48, 0.13)`): respuesta hover de acciones y
  tarjetas que se pueden abrir.

### Named Rules

**The Flat-Editorial Rule.** Un divisor o un cambio tonal es la profundidad por defecto; la sombra
aparece solo para comunicar separación o interacción.

## Shapes

Los controles cotidianos usan radios suaves de 12–20px y las acciones compactas usan forma pill.
Los bloques editoriales pueden usar cortes diagonales discretos inspirados en una caja de regalo,
pero la geometría no debe esconder contenido ni foco. Los bordes son finos, cálidos y de bajo
contraste; no se usan contornos gruesos como decoración.

## Components

### Buttons

- **Shape:** pill en acciones (`999px`); botones editoriales de shell pueden usar `4–8px`.
- **Primary:** vino REGALIA, texto blanco, altura mínima `2.75rem` y peso alto.
- **Hover / Focus:** elevación corta, contorno vino profundo y halo dorado; el cambio debe ser
  visible sin depender solo del color.
- **Secondary / Ghost:** superficie blanca o transparente, texto vino y divisor cálido.

### Chips

- **Style:** fondo transparente o superficie suave, texto vino y borde/divisor discreto.
- **State:** seleccionado por subrayado o fondo tonal; conservar `aria-pressed` cuando sea un
  filtro.

### Cards / Containers

- **Corner Style:** `12–18px` en tarjetas de catálogo; contenedores editoriales pueden ser planos.
- **Background:** superficie blanca sobre papel cálido.
- **Shadow Strategy:** usar Ambient soft solo cuando la tarjeta necesita separación.
- **Border:** línea de papel de 1px; evitar bordes de acento laterales gruesos.
- **Internal Padding:** `1rem` como base, `1.5rem` para bloques de decisión.

### Inputs / Fields

- **Style:** blanco, línea de papel de 1px, radio cercano a `15px`, altura mínima `3rem`.
- **Focus:** borde vino y anillo dorado visible.
- **Error / Disabled:** mensaje junto al campo, contraste suficiente y estado no dependiente solo
  de color.

### Navigation

El shell público es sticky y ligero, con marca a la izquierda, búsqueda central, enlaces de
catálogo y una acción de carrito siempre disponible. En móvil la navegación se convierte en panel
expandible con `aria-expanded`, búsqueda propia y objetivos táctiles amplios.

### Intent Ribbon

La franja de intención es el componente firma: una introducción vino conduce a opciones por persona
u ocasión en una rejilla de divisores finos. Sus iconos pueden usar el sprite de categorías, pero la
etiqueta y el estado deben seguir siendo legibles sin la imagen.

## Do's and Don'ts

### Do:

- **Do** usar tokens `--rg-*` para colores, radios, foco y sombras compartidas.
- **Do** poner disponibilidad, precio y tienda al alcance de la primera lectura.
- **Do** conservar una ruta clara desde intención hasta catálogo y reserva.
- **Do** validar foco de teclado, estados de carga/error/vacío y reducción de movimiento.
- **Do** tratar imágenes de productos y tiendas como contenido, con proporciones estables y alt útil.

### Don't:

- **Don't** convertir cada sección en una pila de tarjetas idénticas.
- **Don't** usar dorado, gradientes o sombras para sustituir jerarquía y contenido.
- **Don't** mezclar iconos emoji o glyphs con el sistema SVG/sprite existente.
- **Don't** ocultar controles esenciales en móvil ni confiar solo en hover.
- **Don't** inventar testimonios, métricas o disponibilidad para llenar una composición.
