# Convenciones Frontend REGALIA

## Idioma

Carpetas tecnicas aceptadas en ingles:

- `core`
- `shared`
- `design-system`
- `domains`
- `pages`
- `guards`
- `interceptors`

Nombres de negocio en espanol:

- variables
- metodos
- clases
- interfaces
- modelos
- DTOs propios
- rutas de dominio
- componentes de negocio
- services de negocio

## Ejemplos Correctos

```txt
producto.model.ts
producto.dto.ts
producto.mapper.ts
producto-api.service.ts
catalogo.routes.ts
pagina-catalogo.ts
tarjeta-producto.ts
```

```ts
obtenerProductos()
crearPedido()
actualizarPerfilVendedor()
idProducto
nombreTienda
precioTotal
```

## Ejemplos A Evitar

```txt
product.model.ts
order.service.ts
seller-profile.component.ts
```

```ts
getProducts()
createOrder()
sellerName
productId
```

## Excepciones

Se permiten nombres tecnicos cuando son convencion del ecosistema:

- `HttpClient`
- `DTO`
- `API`
- `JWT`
- `REST`
- `Router`
- `Observable`
- `signal`
- `computed`
- `input`
- `standalone`
- `zoneless`

## Componentes

Usar Angular CLI para generar componentes.

```bash
ng generate component domains/catalogo/componentes/tarjeta-producto --standalone
```

Cada componente debe tener:

```txt
tarjeta-producto.ts
tarjeta-producto.html
tarjeta-producto.css
tarjeta-producto.spec.ts
```

Preferir APIs modernas:

```ts
readonly producto = input.required<Producto>();
readonly productos = signal<Producto[]>([]);
readonly productosFiltrados = computed(() => this.productos());
```

Evitar `NgModule` en nuevas features. Usar `imports` directamente en el decorador `@Component`.

## Servicios

Servicios HTTP:

```txt
producto-api.service.ts
pedido-api.service.ts
usuario-api.service.ts
```

Servicios de dominio:

```txt
catalogo-consulta.service.ts
checkout-flujo.service.ts
sesion-autenticacion.service.ts
```

## DTOs Y Modelos

DTO representa backend.

Modelo representa frontend.

```txt
producto.dto.ts
producto.model.ts
producto.mapper.ts
```

No usar DTO directamente en componentes visuales.
