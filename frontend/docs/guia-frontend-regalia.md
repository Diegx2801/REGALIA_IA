# Guia Frontend REGALIA

Esta documentacion define la forma de trabajar el frontend de REGALIA con Angular, Bootstrap, NG Bootstrap y una futura adopcion controlada de Clarity para modulos administrativos.

El objetivo es que el frontend mantenga coherencia con el backend, use nombres de negocio en espanol y conserve terminos tecnicos aceptados cuando correspondan.

## Stack Frontend

- Angular standalone components.
- Signals para estado reactivo.
- Control Flow nativo (`@if`, `@for`, `@switch`, `@defer`).
- Zoneless change detection con `provideZonelessChangeDetection()`.
- TypeScript.
- Bootstrap para grilla, utilidades responsive y base visual.
- NG Bootstrap para componentes interactivos compatibles con Angular.
- Clarity como opcion futura para pantallas administrativas densas.
- CSS modular por componente.
- SASS como opcion futura si el sistema visual requiere funciones, mixins o composicion avanzada.
- Design system propio de REGALIA para identidad premium.

## Criterio De Idioma

Se conservan en ingles carpetas o terminos tecnicos ampliamente aceptados:

- `core`
- `shared`
- `design-system`
- `domains`
- `pages`
- `guards`
- `interceptors`
- `DTO`
- `API`
- `REST`
- `JWT`
- `standalone`
- `lazy loading`

Los nombres de negocio deben ir en espanol:

- `ProductoDto`
- `Pedido`
- `UsuarioSesion`
- `SesionAutenticacionService`
- `obtenerProductos()`
- `crearPedido()`
- `actualizarPerfilVendedor()`
- `catalogo.routes.ts`

## Relacion Con MVC

Angular no replica MVC clasico de forma literal, pero puede organizarse de manera equivalente:

- Modelo: interfaces, DTOs y modelos internos en `modelos`.
- Vista: templates HTML y componentes presentacionales.
- Controlador o coordinador: componentes de pagina, services de dominio y stores.

Regla: el componente de pagina coordina el flujo, pero no debe contener toda la logica de negocio ni transformar respuestas complejas del backend.

## Patrones De Diseno

### Singleton

Angular aplica Singleton mediante servicios `providedIn: 'root'`.

Uso recomendado:

- Sesion del usuario.
- Estado del carrito.
- Configuracion global.
- Notificaciones.
- Cliente API.

Ejemplo conceptual:

```ts
@Injectable({ providedIn: 'root' })
export class SesionAutenticacionService {}
```

### Factory

Usar Factory cuando se necesite crear objetos o modelos internos desde DTOs.

En REGALIA normalmente se implementa mediante mappers:

```txt
producto.dto.ts
producto.model.ts
producto.mapper.ts
```

Ejemplo:

```ts
export function mapearProducto(dto: ProductoDto): Producto {
  return {
    idProducto: dto.idProducto,
    nombre: dto.nombre,
    precio: Number(dto.precio),
  };
}
```

### Decorador

Angular usa decoradores como parte de su arquitectura:

- `@Component`
- `@Injectable`
- `@Directive`
- `@Pipe`

Regla: usar decoradores para declarar responsabilidades Angular, no para esconder logica de negocio compleja.

## Bootstrap, NG Bootstrap Y Clarity

### Bootstrap

Bootstrap se usa para:

- Grid responsive.
- Utilidades de espaciado.
- Flexbox.
- Contenedores.
- Formularios base.
- Helpers visuales simples.

### NG Bootstrap

NG Bootstrap se usa para componentes interactivos Angular:

- Modales.
- Dropdowns.
- Offcanvas.
- Tooltips.
- Accordions.
- Tabs.
- Datepicker.
- Pagination.

No debe definir la identidad visual de REGALIA. La identidad premium vive en `design-system`.

### Clarity

Clarity queda reservado para evaluar en administracion:

- Tablas administrativas.
- Formularios densos.
- Gestion de estados.
- Modulos internos de backoffice.

No se recomienda usar Clarity en landing, catalogo publico, detalle de producto o carrito, porque puede hacer que la experiencia comercial pierda personalidad premium.

### Material Design

Material Design no se adopta como libreria base en esta etapa. Se puede tomar como referencia de buenas practicas:

- estados claros de foco;
- jerarquia visual;
- formularios accesibles;
- componentes predecibles;
- feedback inmediato ante acciones.

Evitar mezclar Angular Material, Clarity y Bootstrap al mismo tiempo sin una decision de arquitectura, porque cada sistema trae estilos, patrones y expectativas propias.

### SASS

El proyecto inicia con CSS para mantener simplicidad. SASS seria recomendable si aparecen estas necesidades:

- tokens derivados;
- mixins responsive;
- funciones de color;
- organizacion avanzada del design system;
- reutilizacion intensiva de patrones visuales.

No introducir SASS solo por preferencia. Primero debe existir una necesidad real.

## CSS, Flexbox Y Grid

Usar CSS por componente.

Usar Flexbox para:

- Barras de navegacion.
- Alineacion horizontal.
- Acciones en formularios.
- Elementos de tarjetas.

Usar Grid para:

- Catalogos.
- Dashboards.
- Layouts de formularios.
- Listados con filtros laterales.

Evitar estilos globales salvo tokens, resets, Bootstrap overrides y patrones realmente compartidos.

## UI Y UX

La experiencia REGALIA debe sentirse premium:

- Jerarquia visual clara.
- Buen uso del espacio.
- Textos breves.
- Acciones visibles.
- Estados de carga cuidados.
- Estados vacios utiles.
- Mensajes de error concretos.
- Formularios simples y progresivos.
- Navegacion mobile prioritaria.

Toda pantalla conectada a API debe manejar:

- `loading`
- `empty`
- `error`
- `success`
- `ready`

## Angular

### Angular Moderno En REGALIA

El frontend debe construirse con el modelo moderno de Angular:

- Standalone Components: cada componente declara sus dependencias en `imports`.
- Signals: estado local y derivado con `signal` y `computed`.
- Signal Inputs: preferir `input()` / `input.required()` en componentes nuevos.
- Control Flow: usar `@if`, `@for`, `@switch` y `@defer` en templates nuevos.
- Zoneless: la app no depende de `zone.js`; la deteccion se activa por Signals, eventos y APIs Angular.

Regla practica: no crear `NgModules` nuevos salvo que una libreria externa lo exija claramente.

### Flujo De Una Aplicacion Angular

1. `main.ts` inicia la aplicacion.
2. `app.config.ts` registra providers globales.
3. `app.routes.ts` define rutas principales.
4. Los layouts contienen `router-outlet`.
5. Cada dominio carga sus rutas por lazy loading.
6. Las paginas consumen services o stores.
7. Los services llaman API y transforman DTOs mediante mappers.
8. `provideZonelessChangeDetection()` ejecuta la aplicacion sin `zone.js`.

### Componentes Manuales Y CLI

Preferir Angular CLI:

```bash
ng generate component domains/catalogo/componentes/tarjeta-producto --standalone
```

La CLI crea:

```txt
tarjeta-producto.ts
tarjeta-producto.html
tarjeta-producto.css
tarjeta-producto.spec.ts
```

Para componentes compartidos:

```bash
ng generate component shared/ui/estado-vacio --standalone
```

### Interpolacion

Usar interpolacion para mostrar datos:

```html
<h2>{{ producto.nombre }}</h2>
```

No usar interpolacion para construir HTML inseguro.

### Property Binding

Usar property binding para propiedades:

```html
<img [src]="producto.urlImagen" [alt]="producto.nombre" />
```

### Directivas

Usar directivas estructurales para condiciones y listas:

```html
@if (estaCargando()) {
  <app-estado-carga />
}

@for (producto of productos(); track producto.idProducto) {
  <app-tarjeta-producto [producto]="producto" />
}
```

### Comunicacion Entre Componentes

Usar:

- `input()` o `input.required()` para datos hacia abajo en componentes nuevos.
- `output()` o eventos del componente cuando una accion debe subir al padre.
- Servicios o stores para estado compartido.

Evitar que componentes hermanos se comuniquen directamente con referencias manuales.

## Servicios Y Data Services

Separar servicios:

- Servicio HTTP: consume endpoints.
- Mapper: transforma DTO a modelo interno.
- Servicio de dominio: aplica reglas del frontend.
- Store: conserva estado de una feature.

Ejemplo:

```txt
producto-api.service.ts
producto.dto.ts
producto.model.ts
producto.mapper.ts
catalogo.store.ts
```

## Routing Y Query Params

El routing global solo define layouts y dominios.

Cada dominio define sus rutas:

```txt
catalogo.routes.ts
pedidos.routes.ts
vendedores.routes.ts
```

Usar query params para filtros compartibles:

```txt
/catalogo?rubro=florales&precioMaximo=150&orden=precio-asc
```

Regla: si el estado debe poder compartirse por URL, usar query params. Si es solo UI temporal, usar estado local.

## Peticiones HTTP

GET:

- Listados.
- Detalles.
- Consultas.

POST:

- Crear usuarios.
- Login.
- Crear pedidos.
- Crear sesiones de checkout.
- Enviar recomendaciones IA.

PUT/PATCH:

- Actualizar perfil.
- Cambiar estado.
- Actualizar tienda/producto.

DELETE:

- Desactivar o eliminar recursos cuando el backend lo permita.

## Autenticacion Y Autorizacion

Usar JWT con interceptor:

- Agrega `Authorization: Bearer <token>`.
- Solo para rutas `/api`.

Usar guards:

- `autenticacionGuard`
- `rolGuard`

Roles:

- `CLIENTE`
- `VENDEDOR`
- `ADMIN`

No basta con ocultar botones en frontend. El backend debe validar permisos.

## Seguridad

Recomendaciones:

- No guardar informacion sensible innecesaria en `localStorage`.
- Validar formularios en frontend y backend.
- Nunca confiar solo en validaciones de frontend.
- Evitar `innerHTML` salvo contenido sanitizado.
- No exponer claves privadas en frontend.
- Usar HTTPS en produccion.
- Manejar errores sin mostrar trazas internas.
- Aplicar Content Security Policy desde el servidor.
- Proteger rutas por rol.
- Validar expiracion de token.

Vulnerabilidades comunes:

- XSS.
- CSRF en escenarios con cookies.
- Exposicion de tokens.
- CORS demasiado abierto.
- Inyeccion por inputs no validados.
- Errores con informacion sensible.

## CORS

CORS se configura en backend, no en Angular.

Frontend debe consumir la API desde el origen permitido.

En desarrollo se puede usar proxy Angular:

```txt
proxy.conf.json
```

En produccion, configurar dominios reales permitidos en backend.

Regla: no usar `*` en produccion si hay autenticacion.

## PMI Y Gestion Del Proyecto

Para trabajar REGALIA como proyecto real:

- Definir alcance por modulo.
- Crear EDT/WBS por dominios.
- Priorizar MVP.
- Gestionar riesgos tecnicos.
- Documentar decisiones de arquitectura.
- Controlar cambios.
- Versionar entregables.
- Validar calidad con pruebas.

Cada modulo debe tener:

- Objetivo.
- Endpoints relacionados.
- Pantallas.
- Componentes.
- Validaciones.
- Riesgos.
- Criterios de aceptacion.

## Produccion

Antes de produccion:

- Revisar variables de entorno.
- Activar build production.
- Configurar budgets.
- Revisar accesibilidad.
- Optimizar imagenes.
- Revisar SEO en paginas publicas.
- Probar login por rol.
- Probar flujos criticos.
- Validar CORS.
- Validar errores de API.
