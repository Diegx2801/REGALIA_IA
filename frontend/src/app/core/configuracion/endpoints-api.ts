export const RUTA_BASE_API = '/api' as const;

// Contrato central de endpoints REST. Los dominios consumen estas rutas desde sus data services.
export const ENDPOINTS_API = {
  autenticacion: {
    login: `${RUTA_BASE_API}/auth/login`,
    google: `${RUTA_BASE_API}/auth/google`,
    loginAdministracion: `${RUTA_BASE_API}/admin/auth/login`,
  },
  cuenta: {
    identidades: `${RUTA_BASE_API}/account/identities`,
    vincularGoogle: `${RUTA_BASE_API}/account/identities/google/link`,
    reenviarVerificacionCorreo: `${RUTA_BASE_API}/account/email-verification/resend`,
  },
  usuarios: {
    crear: `${RUTA_BASE_API}/usuarios`,
    perfilActual: `${RUTA_BASE_API}/usuarios/me`,
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
    productosPorTienda: (idTienda: number) =>
      `${RUTA_BASE_API}/vendedores/me/tiendas/${idTienda}/productos`,
    pedidosRecibidos: `${RUTA_BASE_API}/vendedores/me/pedidos`,
    pedidosPorTienda: (idTienda: number) =>
      `${RUTA_BASE_API}/vendedores/me/tiendas/${idTienda}/pedidos`,
    pedidoRecibidoPorId: (idPedido: number) => `${RUTA_BASE_API}/vendedores/me/pedidos/${idPedido}`,
  },
  pedidos: {
    propios: `${RUTA_BASE_API}/pedidos`,
    propioPorId: (idPedido: number) => `${RUTA_BASE_API}/pedidos/${idPedido}`,
    registrarPago: (idPedido: number) => `${RUTA_BASE_API}/pedidos/${idPedido}/pagos`,
    opcionesPagoInicial: `${RUTA_BASE_API}/pedidos/opciones/pago-inicial`,
    confirmar: `${RUTA_BASE_API}/pedidos/confirmar`,
  },
  checkout: {
    sesiones: `${RUTA_BASE_API}/checkout/sessions`,
  },
  ia: {
    recomendarProductos: `${RUTA_BASE_API}/builder-ia/recomendar-productos`,
    chat: `${RUTA_BASE_API}/builder-ia/chat`,
  },
  administracion: {
    usuarios: `${RUTA_BASE_API}/admin/usuarios`,
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
  },
} as const;
