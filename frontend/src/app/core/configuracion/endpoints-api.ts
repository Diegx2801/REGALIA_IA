export const RUTA_BASE_API = '/api' as const;

// Contrato central de endpoints REST. Los dominios consumen estas rutas desde sus data services.
export const ENDPOINTS_API = {
  autenticacion: {
    login: `${RUTA_BASE_API}/auth/login`,
    google: `${RUTA_BASE_API}/auth/google`,
    refrescarSesion: `${RUTA_BASE_API}/auth/session/refresh`,
    loginAdministracion: `${RUTA_BASE_API}/admin/auth/login`,
    confirmarVerificacionCorreo: `${RUTA_BASE_API}/auth/email-verification/confirm`,
    solicitarRecuperacionContrasena: `${RUTA_BASE_API}/auth/password-recovery/request`,
    restablecerContrasena: `${RUTA_BASE_API}/auth/password-recovery/reset`,
  },
  cuenta: {
    identidades: `${RUTA_BASE_API}/account/identities`,
    vincularGoogle: `${RUTA_BASE_API}/account/identities/google/link`,
    reenviarVerificacionCorreo: `${RUTA_BASE_API}/account/email-verification/resend`,
    cambiarContrasena: `${RUTA_BASE_API}/account/password`,
  },
  usuarios: {
    crear: `${RUTA_BASE_API}/usuarios`,
    perfilActual: `${RUTA_BASE_API}/usuarios/me`,
    documentos: `${RUTA_BASE_API}/usuarios/me/documentos`,
    consultarRuc: (numeroRuc: string) =>
      `${RUTA_BASE_API}/usuarios/me/documentos/ruc/${encodeURIComponent(numeroRuc)}`,
    registrarRuc: `${RUTA_BASE_API}/usuarios/me/documentos/ruc`,
  },
  catalogo: {
    productos: `${RUTA_BASE_API}/productos`,
    productoPorId: (idProducto: number) => `${RUTA_BASE_API}/productos/${idProducto}`,
    tiposProducto: `${RUTA_BASE_API}/tipos-producto`,
    rubros: `${RUTA_BASE_API}/rubros`,
  },
  tiendas: {
    publicas: `${RUTA_BASE_API}/tiendas`,
    publicaPorId: (idTienda: number) => `${RUTA_BASE_API}/tiendas/${idTienda}`,
    productos: (idTienda: number) => `${RUTA_BASE_API}/tiendas/${idTienda}/productos`,
  },
  vendedores: {
    perfilActual: `${RUTA_BASE_API}/vendedores/me`,
    tiendas: `${RUTA_BASE_API}/vendedores/me/tiendas`,
    tiendaPorId: (idTienda: number) => `${RUTA_BASE_API}/vendedores/me/tiendas/${idTienda}`,
    productosPorTienda: (idTienda: number) =>
      `${RUTA_BASE_API}/vendedores/me/tiendas/${idTienda}/productos`,
    productoPorId: (idTienda: number, idProducto: number) =>
      `${RUTA_BASE_API}/vendedores/me/tiendas/${idTienda}/productos/${idProducto}`,
    pedidosRecibidos: `${RUTA_BASE_API}/vendedores/me/pedidos`,
    pedidosPorTienda: (idTienda: number) =>
      `${RUTA_BASE_API}/vendedores/me/tiendas/${idTienda}/pedidos`,
    pedidoRecibidoPorId: (idPedido: number) => `${RUTA_BASE_API}/vendedores/me/pedidos/${idPedido}`,
  },
  pedidos: {
    propios: `${RUTA_BASE_API}/pedidos`,
    propioPorId: (idPedido: number) => `${RUTA_BASE_API}/pedidos/${idPedido}`,
    opcionesPagoInicial: `${RUTA_BASE_API}/pedidos/opciones/pago-inicial`,
    confirmar: `${RUTA_BASE_API}/pedidos/confirmar`,
  },
  checkout: {
    sesiones: `${RUTA_BASE_API}/checkout/sessions`,
    sesionPagoRestante: (idPedido: number) =>
      `${RUTA_BASE_API}/checkout/orders/${idPedido}/remaining-payment-session`,
  },
  ia: {
    recomendarProductos: `${RUTA_BASE_API}/builder-ia/recomendar-productos`,
    chat: `${RUTA_BASE_API}/builder-ia/chat`,
  },
  administracion: {
    usuarios: `${RUTA_BASE_API}/admin/usuarios`,
    desactivarUsuario: (idUsuario: number) =>
      `${RUTA_BASE_API}/admin/usuarios/${idUsuario}/desactivar`,
    reactivarUsuario: (idUsuario: number) =>
      `${RUTA_BASE_API}/admin/usuarios/${idUsuario}/reactivar`,
    vendedores: `${RUTA_BASE_API}/admin/vendedores`,
    tiendas: `${RUTA_BASE_API}/admin/tiendas`,
    pedidos: `${RUTA_BASE_API}/admin/pedidos`,
    rubros: `${RUTA_BASE_API}/admin/rubros`,
    tiposProducto: `${RUTA_BASE_API}/admin/tipos-producto`,
    tiposEntrega: `${RUTA_BASE_API}/admin/tipos-entrega`,
    tiposPago: `${RUTA_BASE_API}/admin/tipos-pago`,
    tiposDocumento: `${RUTA_BASE_API}/admin/tipos-documento`,
    roles: `${RUTA_BASE_API}/admin/roles`,
  },
  datosMaestros: {
    tiposEntrega: `${RUTA_BASE_API}/tipos-entrega`,
    tiposDocumento: `${RUTA_BASE_API}/tipos-documento`,
  },
} as const;
