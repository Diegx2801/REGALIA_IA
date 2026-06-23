# REGALIA Frontend Guidelines

Estas reglas mantienen uniforme el frontend Angular sin tocar backend.

## Estructura

- `core/` contiene componentes, layouts, guards, interceptors y servicios transversales.
- `features/` contiene pantallas o flujos completos. Cada feature mantiene su `.ts`, `.html` y `.css`.
- `shared/` contiene modelos y piezas compartidas sin dependencia directa de una pantalla.

## Layout y ancho

- Usar Bootstrap para grilla y espaciado base: `container`, `row`, `col-*`, `g-*`, `d-flex`, `align-items-*`, `justify-content-*`.
- Usar utilidades REGALIA para ancho de pagina:
  - `.rg-page__container` para paginas publicas y comerciales.
  - `.rg-page__container--wide` para dashboards, paneles y vistas administrativas.
  - `.rg-page__container--retail` para portadas o vitrinas que necesitan aprovechar mas ancho visual, con comportamiento cercano a retail.
  - `.rg-page__container--narrow` para formularios y pantallas enfocadas.
- Evitar crear nuevos `max-width` arbitrarios si una utilidad REGALIA ya cubre el caso.
- Si una pantalla no puede usar `container` por su estructura interna, mantener el mismo criterio con `max-width: 1320px` y `margin-inline: auto`.

## CSS y BEM

- Las clases propias de componentes deben seguir BEM: `bloque__elemento--modificador`.
- Bootstrap resuelve estructura; BEM resuelve identidad visual, estados y detalles del componente.
- `src/styles.css` debe quedarse para tokens, resets, overrides de Bootstrap y utilidades realmente compartidas.
- Los estilos de una pantalla deben vivir en el CSS de esa feature, no en el global.
- El budget de estilos por componente avisa desde `10kB` y falla desde `14kB`; si una feature se acerca al limite, dividir layout, reutilizar utilidades globales o simplificar reglas antes de seguir creciendo.

## Breakpoints

Preferir cortes compatibles con Bootstrap:

- `1199.98px`
- `991.98px`
- `767.98px`
- `575.98px`

Si una pantalla necesita un corte propio, documentar por que existe.

## Comentarios

- Comentar intencion y decisiones de UI, no cada propiedad.
- Buenos comentarios explican reglas de layout, estados mock, limites frontend/backend o comportamiento responsive.
- Evitar comentarios obvios como "color del boton" o "margen superior".
