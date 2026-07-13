# Documentacion Completa Del Frontend REGALIA

Ultima actualizacion: 2026-07-09.

Este documento describe el frontend actual de REGALIA archivo por archivo, como funciona, como se organiza, como se conecta con el backend y que buenas practicas aplica. Esta escrito sobre el codigo real ubicado en `frontend/`.

## 1. Resumen Ejecutivo

REGALIA usa un frontend Angular moderno orientado a marketplace, ecommerce y SaaS. La aplicacion conecta clientes, vendedores y administradores con un backend REST en Spring Boot mediante endpoints bajo `/api`.

El frontend actual ya implementa:

- Angular 21 con standalone components.
- Signals (`signal`, `computed`, `input`, `output`) para estado reactivo.
- Control flow moderno (`@if`, `@for`, `@switch`).
- Zoneless change detection con `provideZonelessChangeDetection()`.
- Lazy loading por dominios.
- Guards de autenticacion y autorizacion por rol.
- Interceptors HTTP para JWT y errores de API.
- DTOs, modelos internos y mappers por dominio.
- Carrito local conectado a checkout real.
- Panel cliente, panel vendedor y panel administrativo.
- Componentes compartidos para estados, metricas, listas, filas, filtros, paginacion, botones y formularios.
- Bootstrap y NG Bootstrap instalados; Bootstrap se carga globalmente y NG Bootstrap queda disponible para componentes interactivos futuros.

No se toca backend desde el frontend. El frontend consume contratos REST existentes y transforma respuestas mediante mappers.

## 2. Stack Tecnico

Archivo principal de dependencias: `frontend/package.json`.

Dependencias principales:

- `@angular/*`: Angular 21.
- `@angular/forms`: formularios reactivos y template-driven donde aplica.
- `@angular/router`: rutas publicas, privadas y lazy loading.
- `@angular/common/http`: peticiones REST.
- `rxjs`: Observables para HTTP.
- `bootstrap`: estilos base y utilidades responsive.
- `@ng-bootstrap/ng-bootstrap`: componentes Bootstrap nativos para Angular, disponible para modales/dropdowns/accordions futuros.
- `@popperjs/core`: dependencia de componentes Bootstrap interactivos.

Scripts:

- `npm start`: ejecuta `ng serve --proxy-config proxy.conf.json`.
- `npm run build`: genera build de produccion.
- `npm test`: ejecuta pruebas configuradas por Angular.

## 3. Como Arranca La Aplicacion

### `frontend/src/main.ts`

Punto de entrada de Angular.

Funcion:

- Importa `bootstrapApplication`.
- Importa `App`.
- Importa `appConfig`.
- Inicializa la aplicacion con `bootstrapApplication(App, appConfig)`.

Flujo:

```txt
main.ts -> App -> app.config.ts -> app.routes.ts -> layout -> dominio lazy -> pagina
```

### `frontend/src/index.html`

HTML base donde Angular monta la aplicacion.

Contiene:

- `<base href="/">`, necesario para routing SPA.
- `<meta name="viewport">`, necesario para responsive.
- `<app-root></app-root>`, selector raiz de Angular.

Observacion:

- Actualmente `lang="en"` y `<title>Frontend</title>`. Para produccion seria recomendable cambiarlo a `lang="es"` y `REGALIA`.

### `frontend/src/app/app.ts`

Componente raiz.

Funcion:

- Declara selector `app-root`.
- Importa `RouterOutlet`.
- Mantiene `title = signal('REGALIA')`.
- No contiene logica de negocio.

### `frontend/src/app/app.html`

Template raiz.

Funcion:

- Renderiza solamente `<router-outlet />`.
- Todo el contenido real entra por rutas.

### `frontend/src/app/app.css`

Estilos locales del componente raiz.

Actualmente no concentra estilos importantes. Los estilos globales viven en `src/styles.css`.

### `frontend/src/app/app.config.ts`

Configuracion global de Angular.

Providers:

- `provideBrowserGlobalErrorListeners()`: escucha errores globales del navegador.
- `provideZonelessChangeDetection()`: activa Angular moderno sin `zone.js`.
- `provideRouter(routes)`: registra rutas principales.
- `provideHttpClient(withInterceptors([...]))`: registra interceptors HTTP.

Interceptors registrados:

- `tokenAutenticacionInterceptor`.
- `errorApiInterceptor`.

Buena practica aplicada:

- La configuracion global esta centralizada.
- Los componentes no registran HTTP ni router manualmente.
- La deteccion de cambios depende de Signals/eventos, no de Zone.js.

### `frontend/src/app/app.routes.ts`

Define el arbol principal de rutas.

Rutas publicas:

- `/`: landing.
- `/login`: autenticacion.
- `/catalogo`: catalogo.
- `/catalogo/:idProducto`: detalle de producto.
- `/checkout/solicitud/:idProducto`: checkout desde producto.
- `/checkout/carrito`: checkout desde carrito.
- `/carrito`: carrito local.

Rutas privadas:

- `/cliente`: requiere rol `CLIENTE`.
- `/vendedor`: requiere rol `VENDEDOR`.
- `/admin`: requiere rol `ADMIN`.

Rutas privadas usan:

- `autenticacionGuard`.
- `rolGuard`.

Lazy loading:

- Cada dominio carga sus rutas o componentes solo cuando se visita.
- Esto reduce carga inicial y separa responsabilidades.

Observacion:

- `rolGuard` redirige a `/acceso-denegado`, pero esa ruta aun no existe explicitamente. Actualmente caeria al wildcard si se navega ahi. Recomendado: crear pagina de acceso denegado.

## 4. Configuracion De Build, Proxy Y Assets

### `frontend/angular.json`

Configura el proyecto Angular.

Puntos importantes:

- Entrada browser: `src/main.ts`.
- Estilos globales: `src/styles.css`.
- Assets publicos: carpeta `public`.
- Build production con budgets:
  - warning inicial: `520kB`.
  - error inicial: `1MB`.
  - estilos por componente: warning `4kB`, error `8kB`.

Buena practica:

- Hay control de presupuesto para evitar crecimiento excesivo del bundle.

### `frontend/proxy.conf.json`

Proxy de desarrollo.

Funcion:

- Redirige llamadas `/api` del frontend a `http://localhost:8080`.

Ejemplo:

```txt
Frontend llama: /api/productos
Proxy envia:   http://localhost:8080/api/productos
```

Importante:

- Esto solo aplica en desarrollo con `npm start`.
- CORS real se configura en backend.
- En produccion se debe configurar dominio/API real.

### `frontend/src/styles.css`

Estilos globales y design tokens.

Contiene:

- Import global de Bootstrap: `@import 'bootstrap/dist/css/bootstrap.min.css';`
- Variables CSS de REGALIA:
  - colores;
  - radios;
  - sombras;
  - fuente base;
  - gradiente de marca.
- Reset basico.
- Estilos globales para foco accesible.
- Directivas visuales compartidas:
  - `.rg-boton`.
  - `.rg-formulario-panel`.
  - `.rg-campo-formulario`.
  - `.rg-error-campo`.
- Patrones de panel:
  - `.rg-panel`.
  - `.rg-panel__hero`.
  - `.rg-panel__grid`.
  - `.rg-panel__tarjeta`.

Buena practica:

- Los estilos globales solo contienen tokens y patrones reutilizables.
- Los estilos especificos viven en CSS por componente.

### `frontend/public/assets/brand/producto-fallback.svg`

Imagen fallback para productos sin imagen.

Se usa en:

- Tarjeta de producto.
- Detalle de producto.
- Carrito.

Evita imagenes rotas si el backend no envia imagen.

## 5. Conexion Con Backend

### `frontend/src/app/core/configuracion/endpoints-api.ts`

Contrato central de rutas REST.

Define:

- `RUTA_BASE_API = '/api'`.
- `ENDPOINTS_API`, objeto con rutas por dominio.

Ventaja:

- Si cambia una ruta, se actualiza en un solo lugar.
- Los servicios no escriben strings sueltos.

Endpoints principales:

Autenticacion:

- `POST /api/auth/login`.
- `POST /api/admin/auth/login`.

Usuarios:

- `GET /api/usuarios/me`.
- `PUT /api/usuarios/me`.

Catalogo:

- `GET /api/productos`.
- `GET /api/productos/{idProducto}`.
- `GET /api/tipos-producto`.
- `GET /api/rubros`.

Vendedores:

- `GET /api/vendedores/me`.
- `POST /api/vendedores/me`.
- `GET /api/vendedores/me/tiendas`.
- `POST /api/vendedores/me/tiendas`.
- `GET /api/vendedores/me/tiendas/{idTienda}/productos`.
- `POST /api/vendedores/me/tiendas/{idTienda}/productos`.
- `PUT /api/vendedores/me/tiendas/{idTienda}/productos/{idProducto}`.
- `DELETE /api/vendedores/me/tiendas/{idTienda}/productos/{idProducto}`.
- `GET /api/vendedores/me/pedidos`.
- `GET /api/vendedores/me/tiendas/{idTienda}/pedidos`.
- `GET /api/vendedores/me/pedidos/{idPedido}`.

Pedidos cliente:

- `GET /api/pedidos`.
- `GET /api/pedidos/{idPedido}`.
- `POST /api/pedidos/{idPedido}/pagos`.
- `GET /api/pedidos/opciones/pago-inicial`.

Checkout:

- `POST /api/checkout/sessions`.

Administracion:

- `GET /api/admin/usuarios`.
- `GET /api/admin/vendedores`.
- `GET /api/admin/tiendas`.
- `GET /api/admin/pedidos`.
- endpoints maestros admin para rubros, tipos de producto, entrega, pago, documento y roles.

IA:

- `POST /api/builder-ia/recomendar-productos`.
- `POST /api/builder-ia/chat`.

### Interceptors

#### `frontend/src/app/core/http/interceptors/token-autenticacion.interceptor.ts`

Funcion:

- Lee el token desde `SesionAutenticacionService`.
- Si existe token y la URL empieza con `/api`, agrega:

```txt
Authorization: Bearer <token>
```

Buena practica:

- El JWT se agrega de forma centralizada.
- No se repite logica de headers en cada servicio.
- No se envia token a URLs externas que no empiezan con `/api`.

#### `frontend/src/app/core/http/interceptors/error-api.interceptor.ts`

Funcion:

- Captura errores HTTP.
- Convierte `HttpErrorResponse` en `Error`.
- Normaliza mensajes para que las pantallas muestren errores consistentes.

Buena practica:

- Las paginas no dependen directamente de `HttpErrorResponse`.
- El usuario ve mensajes controlados, no trazas tecnicas.

### Respuesta API compartida

#### `frontend/src/app/shared/modelos/respuesta-api.model.ts`

Modelo generico para respuestas del backend.

Representa la forma comun esperada:

```ts
RespuestaApi<T>
```

Uso:

- Servicios HTTP tipan sus respuestas como `RespuestaApi<Dto>`.
- Luego toman `respuesta.data`.

## 6. Arquitectura Por Capas

El frontend se organiza asi:

```txt
src/app
  core/
  shared/
  design-system/
  domains/
  pages/
```

### `core`

Contiene infraestructura global:

- autenticacion;
- carrito global;
- configuracion de endpoints;
- guards;
- interceptors;
- layouts.

Regla:

- `core` puede ser usado por dominios.
- `core` no debe depender de dominios especificos salvo excepciones justificadas.

### `shared`

Contiene piezas reutilizables sin negocio:

- directivas;
- componentes UI;
- modelos genericos;
- utilidades;
- validadores.

Regla:

- `shared` no debe conocer endpoints ni reglas especificas de vendedor/cliente/admin.

### `design-system`

Contiene documentacion/tokens visuales.

Actualmente:

- `tokens/README.md`.

### `domains`

Cada dominio representa una capacidad de negocio.

Estructura tipica:

```txt
dominio/
  acceso-datos/
  mapeadores/
  modelos/
  paginas/
  componentes/
  dominio.routes.ts
```

Regla:

- La pagina usa servicios.
- El servicio llama API.
- El mapper transforma DTO a modelo.
- La UI usa modelos internos, no DTOs.

### `pages`

Paginas transversales que no pertenecen a un dominio concreto.

Ejemplos:

- landing;
- no encontrado.

## 7. Core: Carpeta Por Carpeta Y Archivo Por Archivo

### `core/autenticacion`

#### `sesion-autenticacion.model.ts`

Define tipos de sesion.

Incluye:

- roles permitidos: `CLIENTE`, `VENDEDOR`, `ADMIN`.
- usuario autenticado.
- token.
- expiracion.

Sirve para:

- tipar la sesion en services;
- validar roles;
- exponer datos a layouts.

#### `almacenamiento-autenticacion.service.ts`

Servicio de persistencia de sesion.

Responsabilidades:

- Leer sesion desde `localStorage` o `sessionStorage`.
- Guardar sesion.
- Limpiar sesion.
- Validar expiracion.

Clave usada:

```txt
regalia_sesion
```

Regla:

- `localStorage` solo se usa si el usuario marca "recordar sesion".
- Si no, usa `sessionStorage`.

#### `sesion-autenticacion.service.ts`

Store global de sesion con Signals.

Expone:

- `usuarioActual`.
- `tokenActual`.
- `estaAutenticado`.
- `rolActual`.
- `iniciarSesion()`.
- `cerrarSesion()`.
- `tieneRol()`.

Patron aplicado:

- Singleton Angular (`providedIn: 'root'`).
- Store reactivo con Signals.

Uso:

- Guards.
- Interceptor JWT.
- Layout publico.
- Layout privado.
- Checkout para saber si requiere login.

### `core/carrito`

#### `carrito.model.ts`

Define `ItemCarrito`.

Campos principales:

- `idProducto`.
- `idTienda`.
- `nombre`.
- `nombreTienda`.
- `tipoProducto`.
- `precioUnitario`.
- `cantidad`.
- `stockDisponible`.
- `urlImagen`.
- `observacion`.

#### `carrito-checkout.service.ts`

Store global del carrito.

Usa:

- `signal` para items.
- `computed` para cantidad, total y estado vacio.
- `localStorage` para persistencia.

Clave usada:

```txt
regalia.carrito.checkout
```

Metodos:

- `agregarProducto()`.
- `actualizarCantidad()`.
- `actualizarObservacion()`.
- `quitarProducto()`.
- `limpiarCarrito()`.

Conexion con backend:

- El carrito no se guarda automaticamente en backend.
- Se envia recien cuando se prepara checkout con `/api/checkout/sessions`.

Buena practica:

- El frontend controla experiencia de carrito.
- El backend revalida stock, monto, tienda y entrega en checkout.

### `core/configuracion`

#### `endpoints-api.ts`

Ya descrito en la seccion de conexion backend.

Es el contrato central de URLs REST.

### `core/guards`

#### `autenticacion.guard.ts`

Protege rutas privadas.

Si hay sesion:

- permite entrar.

Si no hay sesion:

- redirige a `/login`.

#### `rol.guard.ts`

Protege por rol.

Lee `data.roles` desde la ruta.

Ejemplo:

```ts
data: { roles: ['ADMIN'] }
```

Si el rol actual esta permitido:

- deja pasar.

Si no:

- redirige a `/acceso-denegado`.

Buena practica:

- El frontend protege UX.
- El backend debe validar autorizacion real siempre.

### `core/http/interceptors`

#### `token-autenticacion.interceptor.ts`

Adjunta JWT a requests `/api`.

#### `error-api.interceptor.ts`

Normaliza errores HTTP.

### `core/layouts`

#### `layout-publico/layout-publico.ts`

Layout publico para landing, login, catalogo, carrito y checkout.

Responsabilidades:

- Mostrar header publico.
- Leer sesion para mostrar `Ingresar` o `Mi panel`.
- Leer carrito para contador.
- Buscar productos y navegar a `/catalogo?busqueda=...`.
- Cerrar sesion.

#### `layout-publico/layout-publico.html`

Estructura:

- Topbar comercial.
- Marca REGALIA.
- Buscador.
- Navegacion publica.
- Carrito con contador.
- Categorias destacadas.
- `<router-outlet />` para paginas publicas.

#### `layout-publico/layout-publico.css`

Estilos:

- Header sticky.
- Topbar premium.
- Buscador responsive.
- Menu horizontal.
- Categorias con scroll en mobile.

#### `componentes/layout-privado/layout-privado.ts`

Componente base para layouts privados.

Inputs:

- `titulo`.
- `etiqueta`.
- `descripcion`.
- `variante`.
- `enlaces`.

Responsabilidades:

- Renderizar sidebar.
- Mostrar usuario actual.
- Calcular iniciales.
- Cerrar sesion.

#### `componentes/layout-privado/layout-privado.html`

Estructura:

- Sidebar.
- Marca REGALIA.
- Cabecera del panel.
- Menu dinamico.
- Usuario activo.
- Topbar interna.
- Slot `<ng-content />`.

#### `componentes/layout-privado/layout-privado.css`

Estilos:

- Sidebar oscuro.
- Variantes por tipo: cliente, vendedor, administracion.
- Menu responsive.
- Topbar privada.

#### `layout-cliente/layout-cliente.ts/html/css`

Wrapper del panel cliente.

Usa `app-layout-privado` con:

- titulo para cliente;
- enlaces del area cliente;
- variante `cliente`.

#### `layout-vendedor/layout-vendedor.ts/html/css`

Wrapper del panel vendedor.

Usa `app-layout-privado` con:

- titulo para vendedor;
- enlaces de gestion comercial;
- variante `vendedor`.

#### `layout-administracion/layout-administracion.ts/html/css`

Wrapper del backoffice admin.

Usa `app-layout-privado` con:

- titulo administrativo;
- enlaces a dashboard, usuarios, tiendas y pedidos;
- variante `administracion`.

## 8. Shared: Componentes, Directivas Y Utilidades

### `shared/directivas/boton.directive.ts`

Directiva `appBoton` para normalizar acciones.

Se usa sobre:

- `<button>`.
- `<a>`.

Variantes:

- `primario`.
- `secundario`.
- `peligro`.
- `fantasma`.

Inputs:

- `appBoton`.
- `appBotonTamano`.
- `appBotonBloque`.
- `appBotonCargando`.

Buena practica:

- No se crea un componente wrapper que rompa `type="submit"`, `(click)`, `[disabled]` o `routerLink`.
- La directiva conserva el elemento HTML original.

### `shared/directivas/formulario-panel.directive.ts`

Contiene tres directivas:

#### `appFormularioPanel`

Se usa en `<form>`.

Aplica layout de formulario responsive.

Inputs:

- `appFormularioColumnas`.
- `appFormularioUnaColumna`.

#### `appCampoFormulario`

Se usa en `<label>`.

Aplica estructura de campo.

#### `appErrorCampo`

Se usa en `<small>`.

Aplica estilo de error.

Buena practica:

- No interfiere con `ReactiveFormsModule`.
- Mantiene `formControlName` funcionando dentro del form real.

### `shared/modelos/respuesta-api.model.ts`

Modelo generico de respuesta backend.

Sirve para tipar:

```ts
RespuestaApi<T>
```

### `shared/ui/estado-pantalla`

#### `estado-pantalla.ts`

Componente presentacional para estados:

- carga;
- error;
- exito;
- vacio.

Inputs:

- `tipo`.
- `etiqueta`.
- `titulo`.
- `descripcion`.
- `textoAccion`.

Output:

- `accion`.

#### `estado-pantalla.html`

Renderiza mensaje y boton opcional.

#### `estado-pantalla.css`

Estilos por tipo de estado.

Uso:

- Panel cliente.
- Panel vendedor.
- Admin.
- Estados de error/vacio.

### `shared/ui/tarjeta-metrica`

#### `tarjeta-metrica.ts/html/css`

Componente presentacional para KPIs.

Inputs:

- `etiqueta`.
- `valor`.
- `descripcion`.

No calcula metricas. El contenedor calcula y le pasa datos.

Uso:

- Dashboard admin.
- Panel cliente.
- Panel vendedor.
- Paginas admin.

### `shared/ui/grupo-metricas-panel`

Agrupa varias tarjetas metricas.

Sirve para:

- Resumen de usuarios.
- Resumen de tiendas.
- Resumen de pedidos.

No conoce negocio.

### `shared/ui/lista-panel`

Contenedor de listas.

Input:

- `ariaEtiqueta`.

Usa content projection.

Uso:

- Pedidos.
- Productos.
- Usuarios.
- Tiendas.

### `shared/ui/fila-panel`

Fila reusable para listas.

Tipos:

- `doble`.
- `triple`.
- `tres-columnas`.
- `producto`.
- `apilada`.

Usa content projection para no acoplarse a un dominio.

### `shared/ui/filtros-panel`

Componente atributo:

```html
<form app-filtros-panel>
```

Sirve para formularios de filtros administrativos.

Importante:

- No mueve el `FormGroup`.
- Solo normaliza layout.

### `shared/ui/paginacion-panel`

Componente reusable de paginacion.

Inputs:

- `paginaActual`.
- `totalPaginas`.
- `ariaEtiqueta`.

Outputs:

- `anterior`.
- `siguiente`.

Uso:

- Usuarios admin.
- Tiendas admin.
- Pedidos admin.

### `shared/utilidades/confirmar-accion.util.ts`

Utilidad para confirmaciones criticas.

Actualmente usa `window.confirm`.

Uso:

- Desactivar producto vendedor.
- Moderar tienda admin.

Pendiente recomendado:

- Reemplazar por modal con NG Bootstrap para mejor UX.

## 9. Pages

### `pages/inicio/pagina-inicio`

#### `pagina-inicio.ts`

Componente standalone de landing.

Imports:

- `RouterLink`.
- `BotonDirective`.

#### `pagina-inicio.html`

Secciones:

- Hero comercial.
- CTA a catalogo.
- CTA a vendedor.
- Beneficios.
- Pilares de plataforma.

#### `pagina-inicio.css`

Estilo premium:

- gradientes;
- cards;
- layout responsive;
- showcase visual.

### `pages/no-encontrado/pagina-no-encontrado`

Pagina fallback para rutas no encontradas.

Funcion:

- Mostrar error 404 amigable.
- Permitir volver al inicio o catalogo, segun template actual.

## 10. Dominio Autenticacion

Ruta:

```txt
/login
```

### `autenticacion.routes.ts`

Define ruta unica del login.

### `modelos/autenticacion.dto.ts`

DTOs del backend para autenticacion.

Representan:

- request de credenciales;
- response de login;
- roles;
- token;
- expiracion.

### `modelos/autenticacion.model.ts`

Modelo interno usado por frontend.

Separa UI y dominio del contrato bruto del backend.

### `mapeadores/autenticacion.mapper.ts`

Funciones:

- mapear credenciales a DTO.
- mapear respuesta backend a modelo interno.

Buena practica:

- La pagina login no usa DTO directamente.

### `acceso-datos/autenticacion-api.service.ts`

Servicio HTTP.

Metodos:

- `iniciarSesionPublica()`.
- `iniciarSesionAdministracion()`.

Endpoints:

- `/api/auth/login`.
- `/api/admin/auth/login`.

### `paginas/pagina-login`

#### `pagina-login.ts`

Responsabilidades:

- Manejar formulario reactivo.
- Detectar si login es admin por query param `contexto=admin`.
- Enviar credenciales.
- Guardar sesion.
- Redirigir segun rol.

Estados:

- `estaEnviando`.
- `mensajeError`.
- `esLoginAdministracion`.
- `mostrarContrasena`.

#### `pagina-login.html`

Renderiza:

- panel visual;
- formulario de correo/contrasena;
- checkbox recordar sesion;
- boton ingresar;
- link a acceso administrativo.

#### `pagina-login.css`

Estilos de pantalla de login premium y responsive.

## 11. Dominio Catalogo

Rutas:

```txt
/catalogo
/catalogo/:idProducto
```

### `catalogo.routes.ts`

Define:

- listado.
- detalle por id.

### `modelos/producto.dto.ts`

DTO del producto recibido desde backend.

Representa el contrato REST.

### `modelos/producto.model.ts`

Modelo interno de producto.

Se usa en:

- catalogo;
- detalle;
- carrito;
- checkout.

### `mapeadores/producto.mapper.ts`

Convierte DTO a modelo interno.

Responsabilidades:

- Normalizar imagenes.
- Normalizar disponibilidad.
- Asegurar fallback cuando falta informacion.

### `acceso-datos/producto-api.service.ts`

Servicio HTTP de catalogo.

Metodos:

- `obtenerProductos()`.
- `obtenerProductoPorId(idProducto)`.

Endpoints:

- `GET /api/productos`.
- `GET /api/productos/{idProducto}`.

### `componentes/tarjeta-producto`

#### `tarjeta-producto.ts`

Componente presentacional.

Inputs:

- `producto`.

Computeds:

- imagen principal.
- stock bajo.

#### `tarjeta-producto.html`

Renderiza:

- imagen;
- estado disponible/agotado;
- tipo;
- precio;
- nombre;
- descripcion;
- tienda;
- stock;
- accion a detalle.

#### `tarjeta-producto.css`

Card visual de producto.

### `paginas/pagina-catalogo`

#### `pagina-catalogo.ts`

Responsabilidades:

- Cargar productos.
- Leer query param `busqueda`.
- Filtrar por texto.
- Filtrar por tipo.
- Ordenar por relevancia/precio/stock.
- Manejar carga/error/vacio.

Estado con Signals:

- `productos`.
- `cargandoProductos`.
- `mensajeError`.
- `terminoBusqueda`.
- `tipoSeleccionado`.
- `ordenSeleccionado`.

Computeds:

- `tiposProducto`.
- `productosFiltrados`.
- `productosDisponibles`.

#### `pagina-catalogo.html`

Renderiza:

- hero del catalogo;
- panel de filtros;
- atajos de categorias;
- skeleton de carga;
- error controlado;
- estado vacio;
- grid de productos.

#### `pagina-catalogo.css`

Layout premium y responsive para catalogo.

### `paginas/pagina-detalle-producto`

#### `pagina-detalle-producto.ts`

Responsabilidades:

- Leer `idProducto` desde ruta.
- Consultar backend.
- Manejar imagen activa.
- Manejar cantidad.
- Calcular total estimado.
- Agregar producto al carrito.

#### `pagina-detalle-producto.html`

Renderiza:

- galeria;
- miniaturas;
- precio;
- disponibilidad;
- cantidad;
- datos de tienda;
- acciones: solicitar, agregar al carrito, seguir explorando.

#### `pagina-detalle-producto.css`

Layout de detalle producto responsive.

## 12. Dominio Checkout

Rutas:

```txt
/carrito
/checkout/carrito
/checkout/solicitud/:idProducto
```

### `checkout.routes.ts`

Define:

- checkout desde carrito.
- checkout desde producto.

### `modelos/checkout.dto.ts`

DTOs del backend para checkout.

Incluye:

- solicitud de checkout;
- respuesta de sesion;
- opciones de pago inicial.

### `modelos/checkout.model.ts`

Modelos internos para UI.

### `mapeadores/checkout.mapper.ts`

Convierte:

- solicitud frontend a DTO backend.
- resultado backend a modelo interno.
- opciones de pago backend a modelo interno.

### `acceso-datos/checkout-api.service.ts`

Servicio HTTP.

Metodos:

- `obtenerOpcionesPagoInicial()`.
- `crearSesionCheckout()`.

Endpoints:

- `GET /api/pedidos/opciones/pago-inicial`.
- `POST /api/checkout/sessions`.

### `paginas/pagina-carrito`

#### `pagina-carrito.ts`

Responsabilidades:

- Leer carrito desde `CarritoCheckoutService`.
- Detectar retorno de checkout por query params.
- Limpiar carrito si pago fue exitoso.
- Validar personalizacion antes de checkout.
- Navegar a `/checkout/carrito`.

#### `pagina-carrito.html`

Renderiza:

- hero del carrito;
- estado de pago;
- estado vacio;
- lista de items;
- personalizacion por item;
- cantidad por item;
- resumen;
- botones preparar/vaciar.

#### `pagina-carrito.css`

Layout de carrito con resumen sticky y responsive.

### `paginas/pagina-solicitud-checkout`

#### `pagina-solicitud-checkout.ts`

Responsabilidades:

- Determinar si viene desde producto o carrito.
- Cargar producto o items de carrito.
- Cargar tipos de entrega.
- Cargar opciones de pago.
- Validar login.
- Validar datos de formulario.
- Construir observacion global.
- Enviar solicitud al backend.

Formulario:

- cantidad;
- tipo de entrega;
- tipo de pago inicial;
- fecha de entrega;
- observacion.

Conexion backend:

- usa `ProductoApiService`;
- usa `TipoEntregaApiService`;
- usa `CheckoutApiService`;
- usa `CarritoCheckoutService`;
- usa `SesionAutenticacionService`.

#### `pagina-solicitud-checkout.html`

Renderiza:

- resumen producto/carrito;
- formulario checkout;
- errores;
- exito con URL de pago;
- CTA login si no hay sesion.

#### `pagina-solicitud-checkout.css`

Diseño de checkout premium, formulario responsive y panel sticky.

## 13. Dominio Datos Maestros

Dominio tecnico de listas maestras compartidas.

### `modelos/rubro.dto.ts` / `rubro.model.ts`

DTO y modelo interno de rubro.

### `modelos/tipo-producto.dto.ts` / `tipo-producto.model.ts`

DTO y modelo interno de tipo de producto.

### `modelos/tipo-entrega.dto.ts` / `tipo-entrega.model.ts`

DTO y modelo interno de tipo de entrega.

### `mapeadores/rubro.mapper.ts`

Convierte rubro DTO a modelo.

### `mapeadores/tipo-producto.mapper.ts`

Convierte tipo producto DTO a modelo.

### `mapeadores/tipo-entrega.mapper.ts`

Convierte tipo entrega DTO a modelo.

### `acceso-datos/rubro-api.service.ts`

Endpoint:

- `GET /api/rubros`.

Uso:

- Panel vendedor para crear tienda.

### `acceso-datos/tipo-producto-api.service.ts`

Endpoint:

- `GET /api/tipos-producto`.

Uso:

- Panel vendedor para crear producto.

### `acceso-datos/tipo-entrega-api.service.ts`

Endpoint:

- `GET /api/tipos-entrega`.

Uso:

- Checkout.

## 14. Dominio Usuarios / Cliente

Ruta:

```txt
/cliente
```

Proteccion:

- `autenticacionGuard`.
- `rolGuard` con `CLIENTE`.

### `usuarios.routes.ts`

Define la pagina principal del cliente.

### `modelos/usuario.dto.ts` / `usuario.model.ts`

DTO y modelo interno para perfil del cliente.

### `modelos/pedido-cliente.dto.ts` / `pedido-cliente.model.ts`

DTO y modelo interno para pedidos del cliente.

### `mapeadores/usuario.mapper.ts`

Convierte:

- perfil backend a perfil frontend;
- solicitud actualizar perfil a DTO.

### `mapeadores/pedido-cliente.mapper.ts`

Convierte pedido backend a modelo interno.

### `acceso-datos/usuario-api.service.ts`

Endpoints:

- `GET /api/usuarios/me`.
- `PUT /api/usuarios/me`.

Metodos:

- `obtenerPerfilActual()`.
- `actualizarPerfil()`.

### `acceso-datos/pedido-cliente-api.service.ts`

Endpoints:

- `GET /api/pedidos`.
- `GET /api/pedidos/{idPedido}`.
- `POST /api/pedidos/{idPedido}/pagos`.

Metodos:

- `obtenerMisPedidos()`.
- `obtenerMiPedidoPorId()`.
- `registrarPagoRestante()`.

### `paginas/pagina-panel-cliente`

#### `pagina-panel-cliente.ts`

Responsabilidades:

- Cargar perfil y pedidos con `forkJoin`.
- Editar perfil.
- Ver detalle de pedido.
- Registrar pago restante.
- Calcular metricas:
  - pedidos activos;
  - saldo pendiente;
  - total invertido;
  - pedidos recientes;
  - puede registrar pago.

Usa:

- `UsuarioApiService`.
- `PedidoClienteApiService`.
- `EstadoPantallaComponent`.
- `TarjetaMetricaComponent`.
- `ListaPanelComponent`.
- `FilaPanelComponent`.
- directivas de boton/formulario.

#### `pagina-panel-cliente.html`

Renderiza:

- hero privado;
- estado carga/error/exito;
- perfil;
- metricas;
- formulario de perfil;
- historial de pedidos;
- detalle de pedido;
- productos del pedido;
- formulario de pago restante.

#### `pagina-panel-cliente.css`

Estilos para panel cliente.

## 15. Dominio Vendedores

Ruta:

```txt
/vendedor
```

Proteccion:

- `autenticacionGuard`.
- `rolGuard` con `VENDEDOR`.

### `vendedores.routes.ts`

Define pagina principal del vendedor.

### `modelos/vendedor.dto.ts` / `vendedor.model.ts`

DTOs y modelos internos para:

- perfil vendedor;
- tienda vendedor;
- producto vendedor;
- pedidos recibidos;
- detalle de pedido recibido.

### `mapeadores/vendedor.mapper.ts`

Convierte:

- perfil vendedor;
- tienda;
- producto;
- pedido resumen;
- pedido detalle;
- solicitud tienda a DTO;
- solicitud producto a DTO.

### `acceso-datos/vendedor-api.service.ts`

Servicio HTTP del vendedor.

Metodos:

- `obtenerPerfilActual()`.
- `crearPerfilVendedor()`.
- `obtenerTiendas()`.
- `crearTienda()`.
- `obtenerProductosPorTienda()`.
- `crearProducto()`.
- `actualizarProducto()`.
- `desactivarProducto()`.
- `obtenerPedidosRecibidos()`.
- `obtenerPedidosPorTienda()`.
- `obtenerDetallePedidoRecibido()`.

Endpoints:

- `/api/vendedores/me`.
- `/api/vendedores/me/tiendas`.
- `/api/vendedores/me/tiendas/{idTienda}/productos`.
- `/api/vendedores/me/pedidos`.

### `paginas/pagina-panel-vendedor`

#### `pagina-panel-vendedor.ts`

Responsabilidades:

- Cargar perfil, tiendas, pedidos, rubros y tipos de producto.
- Crear perfil vendedor si no existe.
- Crear tienda.
- Seleccionar tienda.
- Crear producto.
- Editar producto.
- Desactivar producto.
- Filtrar pedidos por tienda, estado y busqueda.
- Ver detalle de pedido recibido.

Estados con Signals:

- perfil;
- tiendas;
- productos;
- pedidos;
- pedidoDetalle;
- rubros;
- tiposProducto;
- tienda seleccionada;
- filtros;
- loading;
- errores/exitos.

Computeds:

- tienda seleccionada;
- productos visibles;
- productos sin stock;
- pedidos pendientes;
- saldo pendiente;
- total pagado;
- estados disponibles;
- pedidos filtrados;
- debe crear perfil.

#### `pagina-panel-vendedor.html`

Renderiza:

- hero vendedor;
- perfil vendedor;
- formulario primera tienda;
- metricas;
- selector de tiendas;
- formulario producto;
- listado de productos;
- filtros de pedidos;
- listado de pedidos;
- detalle pedido;
- productos solicitados;
- pagos registrados.

#### `pagina-panel-vendedor.css`

Estilos del panel vendedor.

## 16. Dominio Administracion

Ruta:

```txt
/admin
```

Proteccion:

- `autenticacionGuard`.
- `rolGuard` con `ADMIN`.

### `administracion.routes.ts`

Define:

- dashboard admin;
- usuarios;
- tiendas;
- pedidos.

### `modelos/panel-administracion.dto.ts`

DTOs del backend admin.

Incluye:

- usuario admin;
- vendedor admin;
- tienda admin;
- pedido admin;
- pagina generica/paginacion.

### `modelos/panel-administracion.model.ts`

Modelos internos para UI admin.

### `mapeadores/panel-administracion.mapper.ts`

Convierte DTOs admin a modelos internos.

Tambien normaliza paginas/paginacion.

### `acceso-datos/panel-administracion-api.service.ts`

Servicio HTTP admin.

Metodos principales:

- `obtenerUsuarios()`.
- `obtenerVendedores()`.
- `obtenerTiendas()`.
- `obtenerPedidos()`.
- `aprobarTienda()`.
- `observarTienda()`.
- `rechazarTienda()`.

Endpoints:

- `/api/admin/usuarios`.
- `/api/admin/vendedores`.
- `/api/admin/tiendas`.
- `/api/admin/pedidos`.

### `dashboard/pagina-panel-administracion`

#### `pagina-panel-administracion.ts`

Responsabilidades:

- Cargar usuarios, vendedores, tiendas, pedidos y productos visibles.
- Calcular metricas globales.
- Moderar tiendas desde dashboard.
- Recargar datos tras moderacion.

#### `pagina-panel-administracion.html`

Renderiza:

- hero administrativo;
- metricas;
- revision de tiendas;
- ultimos pedidos;
- usuarios recientes;
- vendedores recientes.

#### `pagina-panel-administracion.css`

Estilos del dashboard.

### `paginas/pagina-admin-usuarios`

#### `pagina-admin-usuarios.ts`

Responsabilidades:

- Filtros por estado y busqueda.
- Cargar usuarios paginados.
- Manejar pagina anterior/siguiente.

Endpoint:

- `GET /api/admin/usuarios`.

#### `pagina-admin-usuarios.html`

Renderiza:

- hero;
- filtros;
- metricas;
- lista de usuarios;
- paginacion.

#### `pagina-admin-usuarios.css`

Estilos especificos minimos.

### `paginas/pagina-admin-tiendas`

#### `pagina-admin-tiendas.ts`

Responsabilidades:

- Filtros por estado de revision y busqueda.
- Cargar tiendas paginadas.
- Aprobar tienda.
- Observar tienda.
- Rechazar tienda.
- Confirmar acciones criticas.

#### `pagina-admin-tiendas.html`

Renderiza:

- hero;
- filtros;
- metricas;
- lista de tiendas;
- acciones de moderacion;
- paginacion.

#### `pagina-admin-tiendas.css`

Estilos de acciones de moderacion.

### `paginas/pagina-admin-pedidos`

#### `pagina-admin-pedidos.ts`

Responsabilidades:

- Filtros por estado de pago y busqueda.
- Cargar pedidos paginados.
- Calcular monto pagado y saldo pendiente.
- Paginacion.

#### `pagina-admin-pedidos.html`

Renderiza:

- hero;
- filtros;
- metricas;
- lista de pedidos;
- paginacion.

#### `pagina-admin-pedidos.css`

Estilos especificos del valor/saldo en filas.

## 17. Design System

### `design-system/tokens/README.md`

Documenta tokens visuales.

Relacionado con:

- variables CSS globales en `styles.css`;
- identidad premium REGALIA;
- colores, sombras y radios.

## 18. Flujo De Datos End-To-End

### Catalogo

```txt
PaginaCatalogo
  -> ProductoApiService.obtenerProductos()
  -> GET /api/productos
  -> RespuestaApi<ProductoPublicoDto[]>
  -> producto.mapper.ts
  -> Producto[]
  -> signal productos
  -> productosFiltrados computed
  -> TarjetaProducto
```

### Detalle A Carrito

```txt
PaginaDetalleProducto
  -> ProductoApiService.obtenerProductoPorId(id)
  -> Producto
  -> CarritoCheckoutService.agregarProducto()
  -> localStorage regalia.carrito.checkout
  -> /carrito
```

### Carrito A Checkout

```txt
PaginaCarrito
  -> valida observaciones
  -> router.navigate('/checkout/carrito')
  -> PaginaSolicitudCheckout
  -> TipoEntregaApiService + CheckoutApiService
  -> CheckoutApiService.crearSesionCheckout()
  -> POST /api/checkout/sessions
```

### Login

```txt
PaginaLogin
  -> AutenticacionApiService
  -> POST /api/auth/login o /api/admin/auth/login
  -> autenticacion.mapper.ts
  -> SesionAutenticacionService.iniciarSesion()
  -> AlmacenamientoAutenticacionService.guardarSesion()
  -> redireccion por rol
```

### Cliente

```txt
LayoutCliente
  -> PaginaPanelCliente
  -> UsuarioApiService + PedidoClienteApiService
  -> GET /api/usuarios/me
  -> GET /api/pedidos
  -> mappers
  -> Signals
  -> UI
```

### Vendedor

```txt
LayoutVendedor
  -> PaginaPanelVendedor
  -> VendedorApiService + datos maestros
  -> perfil, tiendas, productos, pedidos
  -> mappers
  -> Signals
  -> UI gestion comercial
```

### Administracion

```txt
LayoutAdministracion
  -> PanelAdministracionApiService
  -> /api/admin/*
  -> panel-administracion.mapper.ts
  -> dashboard/listas/paginacion
```

## 19. Patrones Y Buenas Practicas Aplicadas

### Singleton

Aplicado con servicios Angular `providedIn: 'root'`.

Ejemplos:

- `SesionAutenticacionService`.
- `AlmacenamientoAutenticacionService`.
- `CarritoCheckoutService`.
- Servicios API.

### Factory / Mapper

Aplicado mediante funciones `mapear...`.

Ejemplos:

- `producto.mapper.ts`.
- `autenticacion.mapper.ts`.
- `checkout.mapper.ts`.
- `vendedor.mapper.ts`.
- `panel-administracion.mapper.ts`.

Ventaja:

- El backend puede cambiar su DTO sin contaminar templates.

### Decorador

Angular usa decoradores:

- `@Component`.
- `@Injectable`.
- `@Directive`.

Ejemplos:

- `BotonDirective`.
- `PaginaCatalogo`.
- `ProductoApiService`.

### SOLID En Frontend

Aplicacion practica:

- Responsabilidad unica:
  - API services solo llaman backend.
  - Mappers solo transforman.
  - Componentes shared solo presentan.
  - Paginas coordinan flujo.
- Bajo acoplamiento:
  - `shared` no conoce negocio.
  - `domains` no exponen DTOs a UI.
  - endpoints centralizados.
- Abierto/cerrado:
  - nuevas pantallas pueden reutilizar directivas/componentes sin modificar dominios existentes.

### Angular Moderno

Aplicado:

- Standalone components.
- Signals.
- Computeds.
- Control flow moderno.
- Lazy loading.
- Zoneless.

## 20. Seguridad Frontend

Implementado:

- JWT en interceptor.
- Guard de autenticacion.
- Guard de rol.
- Expiracion de sesion.
- Limpieza de sesion.
- Errores normalizados.
- Validaciones en formularios.
- No uso de `innerHTML`.
- Binding seguro para imagenes/textos.

Pendiente recomendado:

- Auditoria formal de XSS en URLs de imagen.
- Crear pagina `/acceso-denegado`.
- Evaluar storage de JWT para produccion.
- Confirmar CORS backend.
- Agregar pruebas de guards/interceptors.

## 21. UI/UX Y Responsive

Implementado:

- Header publico sticky.
- Buscador global.
- Landing premium.
- Catalogo responsive.
- Detalle responsive.
- Carrito con resumen sticky.
- Login responsive.
- Paneles privados con sidebar responsive.
- Estados carga/error/vacio/exito.
- Botones normalizados.
- Formularios normalizados.

Componentes UI compartidos:

- `app-estado-pantalla`.
- `app-tarjeta-metrica`.
- `app-grupo-metricas-panel`.
- `app-lista-panel`.
- `app-fila-panel`.
- `app-paginacion-panel`.
- `form[app-filtros-panel]`.
- `appBoton`.
- `appFormularioPanel`.
- `appCampoFormulario`.
- `appErrorCampo`.

## 22. Como Ejecutar Y Validar

Instalar dependencias:

```bash
cd frontend
npm install
```

Levantar frontend con proxy:

```bash
npm start
```

Build:

```bash
npm run build
```

Backend requerido para flujos reales:

```txt
http://localhost:8080
```

Si backend no esta activo:

- catalogo muestra error controlado;
- login no puede completar autenticacion;
- paneles no pueden cargar datos reales;
- guards sin sesion si redirigen correctamente.

## 23. Flujos Que Deben Probarse Con Backend Activo

### Publico

- Landing carga.
- Buscador navega a catalogo con query param.
- Catalogo lista productos.
- Filtros funcionan.
- Detalle carga producto.

### Cliente

- Login con usuario cliente.
- Redireccion a `/cliente`.
- Carga perfil.
- Carga pedidos.
- Ver detalle de pedido.
- Registrar pago restante.

### Vendedor

- Login vendedor.
- Redireccion a `/vendedor`.
- Crear perfil vendedor si aplica.
- Crear tienda.
- Crear producto.
- Editar producto.
- Desactivar producto.
- Ver pedidos recibidos.
- Filtrar pedidos.
- Ver detalle de pedido.

### Admin

- Login admin por `/login?contexto=admin`.
- Redireccion a `/admin`.
- Dashboard carga metricas.
- Usuarios carga paginacion/filtros.
- Tiendas carga paginacion/filtros.
- Aprobar/observar/rechazar tienda.
- Pedidos carga paginacion/filtros.

### Checkout

- Agregar producto al carrito.
- Personalizar item.
- Preparar checkout desde carrito.
- Preparar checkout desde producto.
- Recibir URL de pasarela.
- Volver al carrito con estado de pago.

## 24. Pendientes Reales Del Frontend

Pendientes tecnicos:

- Crear pagina explicita `/acceso-denegado`.
- Agregar pruebas unitarias para services, mappers, guards y stores.
- Agregar pruebas E2E con backend de prueba o mocks.
- Validar todos los flujos con backend activo.
- Evaluar migracion a SCSS si el curso lo exige.
- Usar NG Bootstrap para modales de confirmacion en vez de `window.confirm`.
- Ajustar `index.html` a `lang="es"` y titulo `REGALIA`.

Pendientes funcionales futuros:

- Registro de usuarios.
- Recuperacion de password.
- Favoritos.
- Direcciones.
- Notificaciones.
- Recomendaciones IA visibles.
- Tienda publica del vendedor.
- Pagos reales completos con pasarela productiva.

## 25. Reglas Para Mantener Limpio El Frontend

1. No consumir `HttpClient` desde componentes de pagina.
2. No usar DTOs directamente en templates.
3. Crear mapper cuando una respuesta venga del backend.
4. Mantener nombres de negocio en espanol.
5. Reutilizar `shared/ui` antes de duplicar HTML de panel.
6. Reutilizar `appBoton` para acciones nuevas.
7. Reutilizar `appFormularioPanel` y `appCampoFormulario` para formularios.
8. Mantener lazy loading por dominio.
9. No mover logica de negocio a CSS/HTML.
10. No ocultar errores tecnicos sin dejar mensaje util al usuario.
11. No confiar en frontend para seguridad; backend valida permisos.
12. No mezclar librerias UI sin criterio. Bootstrap/NG Bootstrap son base; Clarity queda para evaluacion futura.

## 26. Conclusiones

El frontend de REGALIA ya tiene una base seria y escalable:

- arquitectura por dominios;
- separacion clara entre UI, services, DTOs, modelos y mappers;
- integracion REST centralizada;
- autenticacion y autorizacion frontend;
- UI responsive con estilo premium;
- componentes compartidos reutilizables;
- Angular moderno con Signals, standalone, control flow y zoneless.

No se debe considerar "cerrado al 100%" hasta validar todos los flujos con backend activo y agregar pruebas. Pero la estructura actual ya corresponde a una base profesional para marketplace/ecommerce/SaaS.

## 27. Anexo: Inventario Completo De Archivos

Este anexo complementa las secciones anteriores. Su objetivo es que cualquier integrante del equipo pueda ubicar cada archivo del frontend actual, entender su funcion y saber si se conecta directamente con backend, routing, estado, UI o configuracion.

### 27.1 Raiz Del Frontend

| Archivo | Funcion | Relacion principal |
| --- | --- | --- |
| `frontend/angular.json` | Configura el proyecto Angular, build, assets, estilos globales y comandos del workspace. | Build y ejecucion. |
| `frontend/package.json` | Define dependencias, scripts y librerias usadas por el frontend. | Angular, Bootstrap, NG Bootstrap. |
| `frontend/package-lock.json` | Bloquea versiones exactas de dependencias instaladas. | Reproducibilidad del entorno. |
| `frontend/proxy.conf.json` | Redirige llamadas `/api` del servidor Angular hacia `http://localhost:8080`. | Conexion local con backend. |
| `frontend/README.md` | Documento base generado por Angular. Puede ampliarse con instrucciones REGALIA. | Documentacion inicial. |
| `frontend/tsconfig.json` | Configuracion TypeScript base para todo el frontend. | Tipado y compilacion. |
| `frontend/tsconfig.app.json` | Configuracion TypeScript especifica para app productiva. | Build de aplicacion. |
| `frontend/tsconfig.spec.json` | Configuracion TypeScript para pruebas. | Testing. |
| `frontend/public/favicon.ico` | Icono del navegador. | Identidad visual. |
| `frontend/public/assets/brand/producto-fallback.svg` | Imagen fallback cuando un producto no tiene imagen valida. | UI catalogo/detalle. |

### 27.2 Documentacion Interna Del Frontend

| Archivo | Funcion | Relacion principal |
| --- | --- | --- |
| `frontend/docs/arquitectura-frontend.md` | Explica la arquitectura propuesta y criterios de organizacion. | Guia tecnica. |
| `frontend/docs/convenciones-frontend.md` | Define nombres, idioma, patrones y reglas de consistencia. | Mantenibilidad. |
| `frontend/docs/documentacion-frontend-completa.md` | Documento maestro del frontend actual. | Onboarding y referencia. |
| `frontend/docs/guia-frontend-regalia.md` | Guia practica para trabajar sobre REGALIA frontend. | Desarrollo diario. |
| `frontend/docs/seguridad-frontend.md` | Recomendaciones y criterios de seguridad frontend. | Seguridad. |

### 27.3 Entrada Y Configuracion Angular

| Archivo | Funcion | Relacion principal |
| --- | --- | --- |
| `frontend/src/index.html` | HTML base donde se monta `<app-root>`. | Inicio SPA. |
| `frontend/src/main.ts` | Ejecuta `bootstrapApplication(App, appConfig)`. | Arranque Angular. |
| `frontend/src/styles.css` | Define variables visuales, tema global, Bootstrap custom y utilidades compartidas. | UI global. |
| `frontend/src/app/app.ts` | Componente raiz standalone con `RouterOutlet` y signal de titulo. | Shell principal. |
| `frontend/src/app/app.html` | Renderiza el outlet principal de rutas. | Routing. |
| `frontend/src/app/app.css` | Estilos locales del componente raiz. | UI raiz. |
| `frontend/src/app/app.config.ts` | Registra router, HttpClient, interceptors y zoneless change detection. | Configuracion global. |
| `frontend/src/app/app.routes.ts` | Define rutas publicas, privadas y lazy loading por dominio. | Navegacion. |
| `frontend/src/app/app.spec.ts` | Prueba base del componente raiz. | Testing inicial. |

### 27.4 Core

| Archivo | Funcion | Relacion principal |
| --- | --- | --- |
| `frontend/src/app/core/autenticacion/sesion-autenticacion.model.ts` | Tipos de sesion, usuario autenticado y roles. | Auth y permisos. |
| `frontend/src/app/core/autenticacion/almacenamiento-autenticacion.service.ts` | Lee, guarda y limpia sesion en almacenamiento local. | Persistencia de JWT. |
| `frontend/src/app/core/autenticacion/sesion-autenticacion.service.ts` | Expone estado reactivo de sesion, login, logout y rol actual. | Auth global. |
| `frontend/src/app/core/carrito/carrito.model.ts` | Define item de carrito y resumen de compra. | Checkout local. |
| `frontend/src/app/core/carrito/carrito-checkout.service.ts` | Gestiona carrito con Signals y persistencia local. | Carrito y checkout. |
| `frontend/src/app/core/configuracion/endpoints-api.ts` | Centraliza rutas REST del backend. | Conexion API. |
| `frontend/src/app/core/guards/autenticacion.guard.ts` | Protege rutas que requieren sesion activa. | Seguridad de rutas. |
| `frontend/src/app/core/guards/rol.guard.ts` | Valida acceso por rol cliente, vendedor o administrador. | Autorizacion frontend. |
| `frontend/src/app/core/http/interceptors/token-autenticacion.interceptor.ts` | Agrega `Authorization: Bearer` en peticiones `/api`. | JWT hacia backend. |
| `frontend/src/app/core/http/interceptors/error-api.interceptor.ts` | Normaliza errores HTTP y limpia sesion ante 401. | Manejo global de errores. |

### 27.5 Layouts

| Archivo | Funcion | Relacion principal |
| --- | --- | --- |
| `frontend/src/app/core/layouts/componentes/layout-privado/layout-privado.ts` | Componente reutilizable para estructura privada con menu, usuario y logout. | Paneles internos. |
| `frontend/src/app/core/layouts/componentes/layout-privado/layout-privado.html` | Template del shell privado. | UI privada. |
| `frontend/src/app/core/layouts/componentes/layout-privado/layout-privado.css` | Estilos del shell privado. | Responsive paneles. |
| `frontend/src/app/core/layouts/layout-publico/layout-publico.ts` | Layout para landing, catalogo, detalle, login, carrito y checkout. | Zona publica. |
| `frontend/src/app/core/layouts/layout-publico/layout-publico.html` | Header publico, navegacion y outlet publico. | UI publica. |
| `frontend/src/app/core/layouts/layout-publico/layout-publico.css` | Estilos responsive del layout publico. | Experiencia publica. |
| `frontend/src/app/core/layouts/layout-cliente/layout-cliente.ts` | Layout contenedor para rutas de cliente. | Rol cliente. |
| `frontend/src/app/core/layouts/layout-cliente/layout-cliente.html` | Renderiza `LayoutPrivado` con menu de cliente. | Panel cliente. |
| `frontend/src/app/core/layouts/layout-cliente/layout-cliente.css` | Estilos especificos si se requieren para cliente. | UI cliente. |
| `frontend/src/app/core/layouts/layout-vendedor/layout-vendedor.ts` | Layout contenedor para rutas de vendedor. | Rol vendedor. |
| `frontend/src/app/core/layouts/layout-vendedor/layout-vendedor.html` | Renderiza `LayoutPrivado` con menu de vendedor. | Panel vendedor. |
| `frontend/src/app/core/layouts/layout-vendedor/layout-vendedor.css` | Estilos especificos si se requieren para vendedor. | UI vendedor. |
| `frontend/src/app/core/layouts/layout-administracion/layout-administracion.ts` | Layout contenedor para rutas de administracion. | Rol admin. |
| `frontend/src/app/core/layouts/layout-administracion/layout-administracion.html` | Renderiza `LayoutPrivado` con menu administrativo. | Panel admin. |
| `frontend/src/app/core/layouts/layout-administracion/layout-administracion.css` | Estilos especificos si se requieren para administracion. | UI admin. |

### 27.6 Shared

| Archivo | Funcion | Relacion principal |
| --- | --- | --- |
| `frontend/src/app/shared/directivas/boton.directive.ts` | Normaliza botones primarios, secundarios, peligro, fantasma, loading y disabled. | UI reutilizable. |
| `frontend/src/app/shared/directivas/formulario-panel.directive.ts` | Normaliza estructura visual de formularios, campos y errores. | Formularios. |
| `frontend/src/app/shared/modelos/respuesta-api.model.ts` | Define contrato generico de respuesta API si backend responde con wrapper. | Integracion REST. |
| `frontend/src/app/shared/utilidades/confirmar-accion.util.ts` | Encapsula confirmacion temporal con `window.confirm`. | Acciones criticas. |
| `frontend/src/app/shared/ui/estado-pantalla/estado-pantalla.ts` | Componente para loading, error, vacio y exito. | Estados de UI. |
| `frontend/src/app/shared/ui/estado-pantalla/estado-pantalla.html` | Template de mensajes de estado. | UX consistente. |
| `frontend/src/app/shared/ui/estado-pantalla/estado-pantalla.css` | Estilos del estado visual. | UI reutilizable. |
| `frontend/src/app/shared/ui/tarjeta-metrica/tarjeta-metrica.ts` | Componente de metrica individual. | Dashboards. |
| `frontend/src/app/shared/ui/tarjeta-metrica/tarjeta-metrica.html` | Template de tarjeta de metrica. | Paneles. |
| `frontend/src/app/shared/ui/tarjeta-metrica/tarjeta-metrica.css` | Estilos de metrica. | UI panel. |
| `frontend/src/app/shared/ui/grupo-metricas-panel/grupo-metricas-panel.ts` | Agrupa varias metricas en grid responsive. | Dashboards. |
| `frontend/src/app/shared/ui/grupo-metricas-panel/grupo-metricas-panel.html` | Template del grupo de metricas. | Paneles. |
| `frontend/src/app/shared/ui/grupo-metricas-panel/grupo-metricas-panel.css` | Estilos del grid de metricas. | Responsive. |
| `frontend/src/app/shared/ui/lista-panel/lista-panel.ts` | Contenedor comun para listados de panel. | Admin, vendedor, cliente. |
| `frontend/src/app/shared/ui/lista-panel/lista-panel.html` | Template de lista reutilizable. | UI de listados. |
| `frontend/src/app/shared/ui/lista-panel/lista-panel.css` | Estilos de lista reusable. | Consistencia visual. |
| `frontend/src/app/shared/ui/fila-panel/fila-panel.ts` | Fila generica con titulo, descripcion, meta y acciones. | Listados. |
| `frontend/src/app/shared/ui/fila-panel/fila-panel.html` | Template de fila reutilizable. | UI panel. |
| `frontend/src/app/shared/ui/fila-panel/fila-panel.css` | Estilos de fila. | Consistencia visual. |
| `frontend/src/app/shared/ui/filtros-panel/filtros-panel.ts` | Componente para busqueda/filtros en paneles. | Admin y listados. |
| `frontend/src/app/shared/ui/filtros-panel/filtros-panel.html` | Template de filtros. | UX de busqueda. |
| `frontend/src/app/shared/ui/filtros-panel/filtros-panel.css` | Estilos de filtros. | Responsive. |
| `frontend/src/app/shared/ui/paginacion-panel/paginacion-panel.ts` | Componente de paginacion compartida. | Listados paginados. |
| `frontend/src/app/shared/ui/paginacion-panel/paginacion-panel.html` | Template de controles de paginacion. | UX de datos. |
| `frontend/src/app/shared/ui/paginacion-panel/paginacion-panel.css` | Estilos de paginacion. | UI panel. |

### 27.7 Pages Publicas

| Archivo | Funcion | Relacion principal |
| --- | --- | --- |
| `frontend/src/app/pages/inicio/pagina-inicio/pagina-inicio.ts` | Controla landing page comercial. | Entrada publica. |
| `frontend/src/app/pages/inicio/pagina-inicio/pagina-inicio.html` | Hero, secciones comerciales, categorias, CTA y propuesta de valor. | Marketing/UX. |
| `frontend/src/app/pages/inicio/pagina-inicio/pagina-inicio.css` | Estilos premium responsive de la landing. | UI publica. |
| `frontend/src/app/pages/no-encontrado/pagina-no-encontrado/pagina-no-encontrado.ts` | Componente para rutas inexistentes. | Routing fallback. |
| `frontend/src/app/pages/no-encontrado/pagina-no-encontrado/pagina-no-encontrado.html` | Mensaje 404 y retorno a inicio. | UX de error. |
| `frontend/src/app/pages/no-encontrado/pagina-no-encontrado/pagina-no-encontrado.css` | Estilos del 404. | UI de error. |

### 27.8 Dominio Autenticacion

| Archivo | Funcion | Relacion principal |
| --- | --- | --- |
| `frontend/src/app/domains/autenticacion/autenticacion.routes.ts` | Define rutas del dominio de autenticacion. | Lazy loading. |
| `frontend/src/app/domains/autenticacion/modelos/autenticacion.dto.ts` | Contratos enviados/recibidos del backend para login. | API auth. |
| `frontend/src/app/domains/autenticacion/modelos/autenticacion.model.ts` | Modelos internos usados por UI/auth. | Capa dominio. |
| `frontend/src/app/domains/autenticacion/mapeadores/autenticacion.mapper.ts` | Convierte respuesta login DTO a sesion frontend. | Adaptacion backend. |
| `frontend/src/app/domains/autenticacion/acceso-datos/autenticacion-api.service.ts` | Ejecuta login contra endpoints del backend. | HTTP POST auth. |
| `frontend/src/app/domains/autenticacion/paginas/pagina-login/pagina-login.ts` | Maneja formulario reactivo, validaciones y envio de login. | UI auth. |
| `frontend/src/app/domains/autenticacion/paginas/pagina-login/pagina-login.html` | Template del login. | UX auth. |
| `frontend/src/app/domains/autenticacion/paginas/pagina-login/pagina-login.css` | Estilos visuales del login. | UI premium. |

### 27.9 Dominio Catalogo

| Archivo | Funcion | Relacion principal |
| --- | --- | --- |
| `frontend/src/app/domains/catalogo/catalogo.routes.ts` | Define rutas de catalogo y detalle. | Lazy loading. |
| `frontend/src/app/domains/catalogo/modelos/producto.dto.ts` | Contrato de producto recibido desde backend. | API productos. |
| `frontend/src/app/domains/catalogo/modelos/producto.model.ts` | Modelo interno de producto para UI. | Dominio catalogo. |
| `frontend/src/app/domains/catalogo/mapeadores/producto.mapper.ts` | Convierte DTOs de producto a modelo interno. | Adaptacion REST. |
| `frontend/src/app/domains/catalogo/acceso-datos/producto-api.service.ts` | Consulta productos, detalle, busqueda y filtros. | HTTP GET catalogo. |
| `frontend/src/app/domains/catalogo/componentes/tarjeta-producto/tarjeta-producto.ts` | Componente visual de producto en listado. | UI catalogo. |
| `frontend/src/app/domains/catalogo/componentes/tarjeta-producto/tarjeta-producto.html` | Template de tarjeta de producto. | UX compra. |
| `frontend/src/app/domains/catalogo/componentes/tarjeta-producto/tarjeta-producto.css` | Estilos de tarjeta premium. | UI catalogo. |
| `frontend/src/app/domains/catalogo/paginas/pagina-catalogo/pagina-catalogo.ts` | Maneja listado, filtros, busqueda, orden y paginacion. | Catalogo con API. |
| `frontend/src/app/domains/catalogo/paginas/pagina-catalogo/pagina-catalogo.html` | Template del listado de productos. | UX catalogo. |
| `frontend/src/app/domains/catalogo/paginas/pagina-catalogo/pagina-catalogo.css` | Estilos responsive del catalogo. | UI publica. |
| `frontend/src/app/domains/catalogo/paginas/pagina-detalle-producto/pagina-detalle-producto.ts` | Carga detalle por id y permite enviar producto al carrito. | Detalle y carrito. |
| `frontend/src/app/domains/catalogo/paginas/pagina-detalle-producto/pagina-detalle-producto.html` | Template de detalle, personalizacion y vendedor. | UX producto. |
| `frontend/src/app/domains/catalogo/paginas/pagina-detalle-producto/pagina-detalle-producto.css` | Estilos del detalle. | UI premium. |

### 27.10 Dominio Checkout

| Archivo | Funcion | Relacion principal |
| --- | --- | --- |
| `frontend/src/app/domains/checkout/checkout.routes.ts` | Define rutas de carrito y solicitud checkout. | Lazy loading. |
| `frontend/src/app/domains/checkout/modelos/checkout.dto.ts` | Contratos enviados al backend para crear solicitud/checkout. | API checkout. |
| `frontend/src/app/domains/checkout/modelos/checkout.model.ts` | Modelos internos de checkout. | Dominio compra. |
| `frontend/src/app/domains/checkout/mapeadores/checkout.mapper.ts` | Convierte carrito y formulario a DTO de backend. | Adaptacion REST. |
| `frontend/src/app/domains/checkout/acceso-datos/checkout-api.service.ts` | Envia solicitud de checkout/pedido al backend. | HTTP POST checkout. |
| `frontend/src/app/domains/checkout/paginas/pagina-carrito/pagina-carrito.ts` | Gestiona items, cantidades, eliminacion y resumen. | Carrito local. |
| `frontend/src/app/domains/checkout/paginas/pagina-carrito/pagina-carrito.html` | Template del carrito. | UX compra. |
| `frontend/src/app/domains/checkout/paginas/pagina-carrito/pagina-carrito.css` | Estilos del carrito responsive. | UI compra. |
| `frontend/src/app/domains/checkout/paginas/pagina-solicitud-checkout/pagina-solicitud-checkout.ts` | Maneja formulario de datos y confirmacion de solicitud. | Checkout con API. |
| `frontend/src/app/domains/checkout/paginas/pagina-solicitud-checkout/pagina-solicitud-checkout.html` | Template del formulario de solicitud. | UX formulario. |
| `frontend/src/app/domains/checkout/paginas/pagina-solicitud-checkout/pagina-solicitud-checkout.css` | Estilos del checkout. | UI conversion. |

### 27.11 Dominio Datos Maestros

| Archivo | Funcion | Relacion principal |
| --- | --- | --- |
| `frontend/src/app/domains/datos-maestros/modelos/rubro.dto.ts` | Contrato de rubro recibido desde backend. | API maestros. |
| `frontend/src/app/domains/datos-maestros/modelos/rubro.model.ts` | Modelo interno de rubro. | Catalogo/filtros. |
| `frontend/src/app/domains/datos-maestros/mapeadores/rubro.mapper.ts` | Convierte DTO de rubro a modelo interno. | Adaptacion REST. |
| `frontend/src/app/domains/datos-maestros/acceso-datos/rubro-api.service.ts` | Consulta rubros. | HTTP GET maestros. |
| `frontend/src/app/domains/datos-maestros/modelos/tipo-producto.dto.ts` | Contrato de tipo de producto. | API maestros. |
| `frontend/src/app/domains/datos-maestros/modelos/tipo-producto.model.ts` | Modelo interno de tipo de producto. | Catalogo/filtros. |
| `frontend/src/app/domains/datos-maestros/mapeadores/tipo-producto.mapper.ts` | Convierte tipo de producto DTO a modelo. | Adaptacion REST. |
| `frontend/src/app/domains/datos-maestros/acceso-datos/tipo-producto-api.service.ts` | Consulta tipos de producto. | HTTP GET maestros. |
| `frontend/src/app/domains/datos-maestros/modelos/tipo-entrega.dto.ts` | Contrato de tipo de entrega. | API maestros. |
| `frontend/src/app/domains/datos-maestros/modelos/tipo-entrega.model.ts` | Modelo interno de tipo de entrega. | Checkout/catalogo. |
| `frontend/src/app/domains/datos-maestros/mapeadores/tipo-entrega.mapper.ts` | Convierte DTO de tipo de entrega a modelo. | Adaptacion REST. |
| `frontend/src/app/domains/datos-maestros/acceso-datos/tipo-entrega-api.service.ts` | Consulta tipos de entrega. | HTTP GET maestros. |

### 27.12 Dominio Usuarios / Cliente

| Archivo | Funcion | Relacion principal |
| --- | --- | --- |
| `frontend/src/app/domains/usuarios/usuarios.routes.ts` | Define rutas privadas del cliente. | Lazy loading. |
| `frontend/src/app/domains/usuarios/modelos/usuario.dto.ts` | Contrato de usuario recibido desde backend. | API usuarios. |
| `frontend/src/app/domains/usuarios/modelos/usuario.model.ts` | Modelo interno de usuario/perfil. | Perfil cliente. |
| `frontend/src/app/domains/usuarios/mapeadores/usuario.mapper.ts` | Convierte usuario DTO a modelo interno. | Adaptacion REST. |
| `frontend/src/app/domains/usuarios/acceso-datos/usuario-api.service.ts` | Consulta perfil del usuario autenticado. | HTTP GET usuario. |
| `frontend/src/app/domains/usuarios/modelos/pedido-cliente.dto.ts` | Contrato de pedido del cliente recibido del backend. | API pedidos. |
| `frontend/src/app/domains/usuarios/modelos/pedido-cliente.model.ts` | Modelo interno para historial/seguimiento. | Panel cliente. |
| `frontend/src/app/domains/usuarios/mapeadores/pedido-cliente.mapper.ts` | Convierte pedido DTO a modelo interno. | Adaptacion REST. |
| `frontend/src/app/domains/usuarios/acceso-datos/pedido-cliente-api.service.ts` | Consulta pedidos y pagos del cliente. | HTTP GET pedidos. |
| `frontend/src/app/domains/usuarios/paginas/pagina-panel-cliente/pagina-panel-cliente.ts` | Orquesta perfil, pedidos, metricas y estados del cliente. | Panel cliente real. |
| `frontend/src/app/domains/usuarios/paginas/pagina-panel-cliente/pagina-panel-cliente.html` | Template del panel cliente. | UX cliente. |
| `frontend/src/app/domains/usuarios/paginas/pagina-panel-cliente/pagina-panel-cliente.css` | Estilos del panel cliente. | UI privada. |

### 27.13 Dominio Vendedores

| Archivo | Funcion | Relacion principal |
| --- | --- | --- |
| `frontend/src/app/domains/vendedores/vendedores.routes.ts` | Define rutas privadas del vendedor. | Lazy loading. |
| `frontend/src/app/domains/vendedores/modelos/vendedor.dto.ts` | Contratos de vendedor, tienda, producto y pedido recibido. | API vendedor. |
| `frontend/src/app/domains/vendedores/modelos/vendedor.model.ts` | Modelos internos del panel vendedor. | Dominio vendedor. |
| `frontend/src/app/domains/vendedores/mapeadores/vendedor.mapper.ts` | Convierte DTOs del vendedor a modelos internos. | Adaptacion REST. |
| `frontend/src/app/domains/vendedores/acceso-datos/vendedor-api.service.ts` | Consulta perfil, tienda, productos, pedidos y metricas del vendedor. | HTTP vendedor. |
| `frontend/src/app/domains/vendedores/paginas/pagina-panel-vendedor/pagina-panel-vendedor.ts` | Orquesta dashboard, catalogo y pedidos recibidos. | Panel vendedor real. |
| `frontend/src/app/domains/vendedores/paginas/pagina-panel-vendedor/pagina-panel-vendedor.html` | Template del panel vendedor. | UX vendedor. |
| `frontend/src/app/domains/vendedores/paginas/pagina-panel-vendedor/pagina-panel-vendedor.css` | Estilos del panel vendedor. | UI privada. |

### 27.14 Dominio Administracion

| Archivo | Funcion | Relacion principal |
| --- | --- | --- |
| `frontend/src/app/domains/administracion/administracion.routes.ts` | Define rutas privadas del admin. | Lazy loading. |
| `frontend/src/app/domains/administracion/modelos/panel-administracion.dto.ts` | Contratos de dashboard, usuarios, tiendas, vendedores y pedidos admin. | API admin. |
| `frontend/src/app/domains/administracion/modelos/panel-administracion.model.ts` | Modelos internos para vistas administrativas. | Dominio admin. |
| `frontend/src/app/domains/administracion/mapeadores/panel-administracion.mapper.ts` | Convierte DTOs admin a modelos internos. | Adaptacion REST. |
| `frontend/src/app/domains/administracion/acceso-datos/panel-administracion-api.service.ts` | Consume endpoints admin de usuarios, tiendas, pedidos y resumen. | HTTP admin. |
| `frontend/src/app/domains/administracion/dashboard/pagina-panel-administracion/pagina-panel-administracion.ts` | Orquesta dashboard administrativo y metricas generales. | Panel admin. |
| `frontend/src/app/domains/administracion/dashboard/pagina-panel-administracion/pagina-panel-administracion.html` | Template del dashboard admin. | UX admin. |
| `frontend/src/app/domains/administracion/dashboard/pagina-panel-administracion/pagina-panel-administracion.css` | Estilos del dashboard admin. | UI privada. |
| `frontend/src/app/domains/administracion/paginas/pagina-admin-usuarios/pagina-admin-usuarios.ts` | Gestiona listado, filtro y acciones de usuarios. | Admin usuarios. |
| `frontend/src/app/domains/administracion/paginas/pagina-admin-usuarios/pagina-admin-usuarios.html` | Template del listado de usuarios. | UX admin. |
| `frontend/src/app/domains/administracion/paginas/pagina-admin-usuarios/pagina-admin-usuarios.css` | Estilos de usuarios admin. | UI panel. |
| `frontend/src/app/domains/administracion/paginas/pagina-admin-tiendas/pagina-admin-tiendas.ts` | Gestiona listado, filtro y acciones de tiendas. | Admin tiendas. |
| `frontend/src/app/domains/administracion/paginas/pagina-admin-tiendas/pagina-admin-tiendas.html` | Template del listado de tiendas. | UX admin. |
| `frontend/src/app/domains/administracion/paginas/pagina-admin-tiendas/pagina-admin-tiendas.css` | Estilos de tiendas admin. | UI panel. |
| `frontend/src/app/domains/administracion/paginas/pagina-admin-pedidos/pagina-admin-pedidos.ts` | Gestiona listado, filtro y acciones de pedidos. | Admin pedidos. |
| `frontend/src/app/domains/administracion/paginas/pagina-admin-pedidos/pagina-admin-pedidos.html` | Template del listado de pedidos. | UX admin. |
| `frontend/src/app/domains/administracion/paginas/pagina-admin-pedidos/pagina-admin-pedidos.css` | Estilos de pedidos admin. | UI panel. |

### 27.15 Design System Y Dominio General

| Archivo | Funcion | Relacion principal |
| --- | --- | --- |
| `frontend/src/app/design-system/tokens/README.md` | Documenta tokens visuales, colores, espaciados y criterios de estilo. | Sistema visual. |
| `frontend/src/app/domains/README.md` | Explica criterio de dominios y separacion funcional. | Arquitectura. |
