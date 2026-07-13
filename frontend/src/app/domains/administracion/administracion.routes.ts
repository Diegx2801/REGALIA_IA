import { Routes } from '@angular/router';

export const ADMINISTRACION_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'resumen',
  },
  {
    path: 'resumen',
    loadComponent: () =>
      import('./paginas/pagina-admin-resumen/pagina-admin-resumen').then(
        (m) => m.PaginaAdminResumen,
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
    path: 'vendedores',
    loadComponent: () =>
      import('./paginas/pagina-admin-vendedores/pagina-admin-vendedores').then(
        (m) => m.PaginaAdminVendedores,
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
  {
    path: 'datos-maestros',
    loadComponent: () =>
      import('./paginas/pagina-admin-datos-maestros/pagina-admin-datos-maestros').then(
        (m) => m.PaginaAdminDatosMaestros,
      ),
  },
];
