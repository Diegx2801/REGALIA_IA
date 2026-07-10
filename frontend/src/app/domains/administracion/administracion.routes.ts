import { Routes } from '@angular/router';

export const ADMINISTRACION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./dashboard/pagina-panel-administracion/pagina-panel-administracion').then(
        (m) => m.PaginaPanelAdministracion,
      ),
  },
  {
    path: 'usuarios',
    loadComponent: () =>
      import('./paginas/pagina-admin-usuarios/pagina-admin-usuarios').then(
        (m) => m.PaginaAdminUsuarios,
      ),
  },
  {
    path: 'tiendas',
    loadComponent: () =>
      import('./paginas/pagina-admin-tiendas/pagina-admin-tiendas').then(
        (m) => m.PaginaAdminTiendas,
      ),
  },
  {
    path: 'pedidos',
    loadComponent: () =>
      import('./paginas/pagina-admin-pedidos/pagina-admin-pedidos').then(
        (m) => m.PaginaAdminPedidos,
      ),
  },
];
