# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

La audiencia principal son personas que buscan un regalo personalizado o una experiencia
local y necesitan comparar opciones, disponibilidad, precio y condiciones de reserva. También
existen experiencias separadas para vendedores que gestionan su tienda y catálogo, y para
administradores que supervisan usuarios, tiendas, pedidos y datos maestros.

> Supuesto inferido del código y de la solicitud de aplicar una mejora visual global; debe
> confirmarse si el producto cambia de audiencia o prioridad.

## Product Purpose

REGALIA conecta clientes con tiendas y emprendedores locales que ofrecen regalos personalizados.
La plataforma ordena la búsqueda, muestra productos disponibles, permite solicitar ayuda con IA,
habilita reservas con seña y permite seguir el pedido. El éxito consiste en que el cliente pueda
decidir con claridad y que vendedores y administradores puedan operar sus responsabilidades sin
mezclar contextos.

## Positioning

Su mecanismo diferencial es convertir una intención de regalo (persona, ocasión, estilo y
presupuesto) en opciones reales de tiendas locales aprobadas, con disponibilidad y condiciones
visibles antes de reservar.

> Posicionamiento inferido de la navegación pública, copy de inicio y capacidades del backend.

## Operating Context

La aplicación web se usa desde móvil, tablet y escritorio. La navegación pública reúne inicio,
catálogo, ayuda de REGALIA IA, carrito y onboarding de vendedores. Las áreas privadas están
separadas por contexto: cliente, vendedor y administrador; el backend valida autenticación y rol.

## Capabilities and Constraints

- Frontend Angular 21 standalone, TypeScript estricto y detección zoneless.
- Backend Java 21 con Spring Boot, PostgreSQL, Flyway, JWT y respuestas normalizadas bajo `/api`.
- El frontend debe conservar separación entre DTO, modelos de UI, mapeadores y servicios HTTP.
- El diseño debe ser responsive, accesible por teclado y compatible con `prefers-reduced-motion`.
- Las reservas, pagos, pedidos y permisos siguen siendo responsabilidad del backend; el diseño no
  debe inventar estados ni datos funcionales.

## Brand Commitments

El nombre REGALIA, su enfoque en regalos locales y personalizados, la visibilidad de tiendas
verificadas, las reservas con seña y la separación visual entre cliente, vendedor y administrador
son compromisos existentes que deben conservarse. El frontend actual usa una identidad editorial
de vino profundo, dorado y superficies de papel cálido.

## Evidence on Hand

La evidencia disponible está en `frontend/src/app`, `frontend/src/styles.css`,
`frontend/src/styles/public-marketplace.css`, los componentes de inicio y las rutas públicas y
privadas. La base local contiene datos de demostración para catálogo, tiendas y autenticación.
No hay testimonios, métricas comerciales ni claims externos confirmados; no deben fabricarse.

## Product Principles

- Decidir con claridad antes de reservar.
- Poner a las tiendas locales y sus productos reales en primer plano.
- Mantener separados los contextos y permisos de cada tipo de usuario.
- Convertir intención en acción con recorridos cortos y recuperables.
- Hacer que la confianza sea visible mediante disponibilidad, condiciones y vendedores verificados.

## Accessibility & Inclusion

La interfaz debe ofrecer HTML semántico, nombres accesibles, foco visible, objetivos táctiles
adecuados, mensajes de estado anunciables y una alternativa equivalente cuando el usuario reduce
el movimiento. El contenido debe seguir siendo comprensible con zoom y en anchos móviles.
