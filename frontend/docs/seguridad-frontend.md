# Seguridad Frontend REGALIA

## Autenticacion

REGALIA usa JWT para autenticar solicitudes protegidas.

El token se adjunta mediante `token-autenticacion.interceptor.ts`.

Reglas:

- No guardar datos sensibles innecesarios.
- Limpiar sesion al cerrar.
- Redirigir si no hay token.
- Validar roles en rutas.
- El backend siempre debe validar permisos.

## Autorizacion

Roles:

- `CLIENTE`
- `VENDEDOR`
- `ADMIN`

Usar `rolGuard` para rutas protegidas.

Ejemplo:

```ts
data: { roles: ['ADMIN'] }
```

## CORS

CORS debe configurarse en backend.

En desarrollo, Angular puede usar proxy.

En produccion:

- No usar origen `*`.
- Permitir solo dominios oficiales.
- Validar headers requeridos.
- Validar metodos permitidos.

## XSS

Evitar:

- `innerHTML` con contenido de usuario.
- Construir HTML desde respuestas de API.
- Insertar URLs no validadas.

Preferir property binding:

```html
<img [src]="producto.urlImagen" [alt]="producto.nombre" />
```

## Manejo De Errores

No mostrar trazas internas.

Mostrar mensajes claros:

- Credenciales invalidas.
- No se pudo cargar el catalogo.
- No se pudo confirmar el pedido.
- El pago no pudo validarse.

## Formularios

Toda validacion frontend debe repetirse en backend.

Validar:

- email
- contrasena
- telefono
- documento
- precio
- stock
- fechas
- metodos de pago

