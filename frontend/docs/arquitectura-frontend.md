# Arquitectura Frontend REGALIA

El frontend sigue una arquitectura `domain-first` alineada con el backend Spring Boot.

## Capas

- `core`: infraestructura global de la aplicacion. Incluye configuracion, HTTP, guards, autenticacion, layouts y rutas transversales.
- `shared`: componentes UI genericos, pipes, directivas, validadores, modelos compartidos y utilidades sin reglas de negocio.
- `design-system`: tokens, tema visual y patrones reutilizables de REGALIA.
- `domains`: modulos de negocio conectados con endpoints REST del backend.
- `pages`: paginas transversales que no pertenecen a un dominio especifico.

## Angular Moderno

REGALIA debe trabajar con Angular moderno por defecto:

- `standalone components`: no crear `NgModules` para nuevas features.
- `Signals`: usar `signal`, `computed` e `input()` para estado de UI y datos derivados.
- `Control Flow`: usar `@if`, `@for`, `@switch` y `@defer` cuando aplique.
- `Zoneless`: la app se configura con `provideZonelessChangeDetection()` en `app.config.ts`.

Regla: si una pantalla necesita actualizar UI por datos async, la fuente final que lee el template debe ser un Signal o un estado derivado claro. Evitar depender de mutaciones silenciosas de objetos.

## Regla De Integracion REST

Cada dominio debe separar:

- `acceso-datos`: servicios HTTP y DTOs.
- `mapeadores`: conversion entre DTOs del backend y modelos internos.
- `modelos`: entidades de frontend usadas por UI y estado.
- `componentes`: piezas presentacionales del dominio.
- `paginas`: componentes de ruta.

Los componentes no deben consumir `HttpClient` directamente. Las respuestas del backend deben transformarse mediante mappers antes de llegar a la UI.

## Dominios Iniciales

- `autenticacion`: login, registro, JWT y roles.
- `usuarios`: perfil de usuario y cuenta.
- `vendedores`: perfil vendedor y gestion comercial.
- `tiendas`: tiendas publicas y tiendas del vendedor.
- `catalogo`: productos, categorias, filtros y detalle.
- `pedidos`: pedidos cliente, vendedor y administrador.
- `checkout`: confirmacion de pedido y sesiones.
- `pagos`: pagos, estados y pasarela.
- `documentos`: documentos de usuario y vendedor.
- `datos-maestros`: rubros, tipos de producto, entrega, pago, documento y roles.
- `administracion`: vistas administrativas compuestas.
- `ia`: recomendaciones y builder IA.

## Convencion

Usar Angular CLI para componentes, paginas y layouts. Mantener archivos por componente:

```txt
feature-name.ts
feature-name.html
feature-name.css
feature-name.spec.ts
```

La estructura debe crecer por dominio, no por tipo tecnico global. Las carpetas tecnicas pueden conservar convenciones Angular/industria como `core`, `shared`, `design-system`, `domains`, `pages`, `guards`, `interceptors`, `DTO`, `API`, `JWT`, `REST` y `standalone`.

Los nombres del negocio en codigo si deben mantenerse en espanol: clases, constantes, variables, metodos, modelos, DTOs propios, rutas de dominio y servicios. Ejemplos: `PaginaInicio`, `ENDPOINTS_API`, `obtenerProductos`, `crearPedido`, `ProductoDto`, `pedido.model.ts`.
