# REGALIA Frontend

Aplicación web del marketplace REGALIA construida con Angular 21, TypeScript estricto,
componentes standalone, Signals y ejecución zoneless. Contiene experiencias diferenciadas para
cliente, vendedor y administrador.

## Requisitos y ejecución local

- Node.js compatible con Angular 21 y npm 10 o superior.
- Backend REGALIA disponible mediante el proxy definido en `proxy.conf.json`.

```bash
npm install
npm start
```

El servidor local se publica en `http://localhost:4200`. Las rutas `/api` se envían al backend; el
frontend no incluye mocks ni sustituye contratos ausentes.

## Organización

- `src/app/core`: autenticación, guards, interceptores, layouts y servicios globales.
- `src/app/domains`: catálogo, checkout, usuarios, vendedores, administración y datos maestros.
- `src/app/pages`: páginas públicas transversales, como Inicio y solicitud mediante IA.
- `src/app/shared`: UI, directivas, modelos y utilidades reutilizables.
- `src/app/design-system`: tokens versionados utilizados por la aplicación.

Las URLs del API se centralizan en `core/configuracion/endpoints-api.ts`. Cada dominio mantiene
separados DTO de red, modelo de presentación y mapeador cuando el contrato lo requiere.

## Autenticación y carrito

Spring Security es la autoridad final de acceso. Los guards conservan la ruta solicitada para volver
después del login y el interceptor global cierra la sesión ante una respuesta 401 autenticada.

El carrito se guarda localmente por identidad:

- invitado: `regalia.carrito.checkout.invitado`;
- usuario: `regalia.carrito.checkout.usuario.<id>`.

Al iniciar sesión, el carrito invitado se combina una sola vez con el del usuario. Los carritos de
cuentas diferentes permanecen aislados. No se deben guardar tokens, credenciales ni datos sensibles
en nuevas claves de almacenamiento.

## Calidad

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test:ci
npm run test:coverage
npm run build
```

`npm run verify` ejecuta lint, typecheck, pruebas y build en ese orden. Las pruebas unitarias usan
Vitest a través del builder oficial de Angular; la cobertura se genera localmente en `coverage/`.

`format:check` también está disponible, pero la base heredada aún contiene archivos anteriores a la
configuración de Prettier. Los archivos modificados deben formatearse con `npm run format`; la
normalización total debe hacerse en un cambio mecánico independiente para conservar un historial
revisable.

## Flujos críticos a verificar

1. Inicio de sesión y retorno a la ruta protegida original.
2. Separación de carrito entre invitado y distintas cuentas.
3. Catálogo, filtros sincronizados con URL y ficha pública de tienda.
4. Checkout restringido a CLIENTE con correo verificado.
5. Revisión documental administrativa y cambios de estado confirmados.
