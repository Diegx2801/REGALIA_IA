export const API_BASE_PATH = '/api' as const;

export const API_ENDPOINTS = {
  auth: {
    login: `${API_BASE_PATH}/auth/login`,
    adminLogin: `${API_BASE_PATH}/admin/auth/login`,
    register: `${API_BASE_PATH}/usuarios`,
  },
  users: {
    me: `${API_BASE_PATH}/usuarios/me`,
  },
  marketplace: {
    products: `${API_BASE_PATH}/productos`,
    productById: (id: number) => `${API_BASE_PATH}/productos/${id}`,
    stores: `${API_BASE_PATH}/tiendas`,
  },
  orders: {
    initialPaymentOptions: `${API_BASE_PATH}/pedidos/opciones/pago-inicial`,
    confirm: `${API_BASE_PATH}/pedidos/confirmar`,
    mine: `${API_BASE_PATH}/pedidos`,
  },
  deliveryTypes: {
    list: `${API_BASE_PATH}/tipos-entrega`,
  },
} as const;

export function isApiRequestUrl(url: string): boolean {
  return url === API_BASE_PATH || url.startsWith(`${API_BASE_PATH}/`);
}
