# Frontend de REGALIA

Aplicación Angular para REGALIA, una plataforma local de Trujillo que conecta clientes con vendedores de regalos y servicios personalizados mediante coincidencia inteligente.

## Flujos MVP

- Inicio: propuesta de valor y modelo de reserva.
- Pedir con IA: interpretación de necesidad y recomendaciones.
- Catálogo: vendedores locales con filtros por categoría, ocasión y presupuesto.
- Vendedores: registro, perfil base y reputación.
- Panel: pedidos, estados, señas y pagos.

## Desarrollo

```bash
npm run start
```

Abrir `http://localhost:4200/`.

## Validación

```bash
npm run build
npm test -- --watch=false
```

<!-- DESPLIEGUE FRONTEND: el build genera archivos estaticos listos para publicarse en hosting web. -->

### Desarrollo local con ngrok

Para probar flujos externos como Mercado Pago usando Angular con ngrok, no agregar el dominio temporal en `angular.json`.

Levantar el frontend así:

```powershell
$env:__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS="TU_DOMINIO_NGROK.ngrok-free.dev"
npm start
```
