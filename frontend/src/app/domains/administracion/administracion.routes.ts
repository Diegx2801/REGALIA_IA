import { Routes } from '@angular/router';

export const ADMINISTRACION_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'resumen',
  },
  {
    path: 'resumen',
    title: 'Resumen administrativo | REGALIA',
    loadComponent: () =>
      import('./paginas/pagina-admin-resumen/pagina-admin-resumen').then(
        (m) => m.PaginaAdminResumen,
      ),
  },
  {
    path: 'usuarios/:idUsuario',
    title: 'Detalle de usuario | REGALIA',
    data: { tipoDetalle: 'usuario' },
    loadComponent: () =>
      import('./paginas/pagina-admin-detalle/pagina-admin-detalle').then(
        (m) => m.PaginaAdminDetalle,
      ),
  },
  {
    path: 'usuarios',
    title: 'Gestión de usuarios | REGALIA',
    loadComponent: () =>
      import('./paginas/pagina-admin-usuarios/pagina-admin-usuarios').then(
        (m) => m.PaginaAdminUsuarios,
      ),
  },
  {
    path: 'vendedores/:idVendedor',
    title: 'Detalle de vendedor | REGALIA',
    data: { tipoDetalle: 'vendedor' },
    loadComponent: () =>
      import('./paginas/pagina-admin-detalle/pagina-admin-detalle').then(
        (m) => m.PaginaAdminDetalle,
      ),
  },
  {
    path: 'vendedores',
    title: 'Gestión de vendedores | REGALIA',
    loadComponent: () =>
      import('./paginas/pagina-admin-vendedores/pagina-admin-vendedores').then(
        (m) => m.PaginaAdminVendedores,
      ),
  },
  {
    path: 'tiendas/:idTienda',
    title: 'Detalle de tienda | REGALIA',
    data: { tipoDetalle: 'tienda' },
    loadComponent: () =>
      import('./paginas/pagina-admin-detalle/pagina-admin-detalle').then(
        (m) => m.PaginaAdminDetalle,
      ),
  },
  {
    path: 'tiendas',
    title: 'Gestión de tiendas | REGALIA',
    loadComponent: () =>
      import('./paginas/pagina-admin-tiendas/pagina-admin-tiendas').then(
        (m) => m.PaginaAdminTiendas,
      ),
  },
  {
    path: 'pedidos/:idPedido',
    title: 'Detalle de pedido | REGALIA',
    data: { tipoDetalle: 'pedido' },
    loadComponent: () =>
      import('./paginas/pagina-admin-detalle/pagina-admin-detalle').then(
        (m) => m.PaginaAdminDetalle,
      ),
  },
  {
    path: 'pedidos',
    title: 'Gestión de pedidos | REGALIA',
    loadComponent: () =>
      import('./paginas/pagina-admin-pedidos/pagina-admin-pedidos').then(
        (m) => m.PaginaAdminPedidos,
      ),
  },
  {
    path: 'datos-maestros',
    title: 'Datos maestros | REGALIA',
    loadComponent: () =>
      import('./paginas/pagina-admin-datos-maestros/pagina-admin-datos-maestros').then(
        (m) => m.PaginaAdminDatosMaestros,
      ),
  },
];
