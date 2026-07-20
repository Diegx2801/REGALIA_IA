import { Routes } from '@angular/router';
import { VendedorPanelStore } from './estado/vendedor-panel.store';
import { confirmarCambiosProductoGuard } from './guards/confirmar-cambios-producto.guard';
import { confirmarCambiosTiendaGuard } from './guards/confirmar-cambios-tienda.guard';

export const VENDEDORES_ROUTES: Routes = [
  {
    path: '',
    providers: [VendedorPanelStore],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'resumen',
      },
      {
        path: 'resumen',
        title: 'Centro vendedor | REGALIA',
        loadComponent: () =>
          import('./paginas/pagina-vendedor-resumen/pagina-vendedor-resumen').then(
            (m) => m.PaginaVendedorResumen,
          ),
      },
      {
        path: 'tiendas',
        title: 'Mis tiendas | REGALIA',
        canDeactivate: [confirmarCambiosTiendaGuard],
        loadComponent: () =>
          import('./paginas/pagina-vendedor-tiendas/pagina-vendedor-tiendas').then(
            (m) => m.PaginaVendedorTiendas,
          ),
      },
      {
        path: 'tiendas/:idTienda/productos/nuevo',
        title: 'Nuevo producto | REGALIA',
        canDeactivate: [confirmarCambiosProductoGuard],
        loadComponent: () =>
          import('./paginas/pagina-vendedor-productos/pagina-vendedor-productos').then(
            (m) => m.PaginaVendedorProductos,
          ),
      },
      {
        path: 'tiendas/:idTienda/productos/:idProducto/editar',
        title: 'Editar producto | REGALIA',
        canDeactivate: [confirmarCambiosProductoGuard],
        loadComponent: () =>
          import('./paginas/pagina-vendedor-productos/pagina-vendedor-productos').then(
            (m) => m.PaginaVendedorProductos,
          ),
      },
      {
        path: 'tiendas/:idTienda/pedidos',
        title: 'Pedidos de la tienda | REGALIA',
        loadComponent: () =>
          import('./paginas/pagina-vendedor-pedidos/pagina-vendedor-pedidos').then(
            (m) => m.PaginaVendedorPedidos,
          ),
      },
      {
        path: 'tiendas/:idTienda',
        title: 'Gestión de tienda | REGALIA',
        loadComponent: () =>
          import('./paginas/pagina-vendedor-tienda/pagina-vendedor-tienda').then(
            (m) => m.PaginaVendedorTienda,
          ),
      },
      {
        path: 'productos',
        pathMatch: 'full',
        redirectTo: 'tiendas',
      },
      {
        path: 'pedidos',
        title: 'Pedidos recibidos | REGALIA',
        loadComponent: () =>
          import('./paginas/pagina-vendedor-pedidos/pagina-vendedor-pedidos').then(
            (m) => m.PaginaVendedorPedidos,
          ),
      },
    ],
  },
];
