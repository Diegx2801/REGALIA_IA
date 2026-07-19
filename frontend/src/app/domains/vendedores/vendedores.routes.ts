import { Routes } from '@angular/router';

export const VENDEDORES_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'resumen',
  },
  {
    path: 'resumen',
    loadComponent: () =>
      import('./paginas/pagina-vendedor-resumen/pagina-vendedor-resumen').then(
        (m) => m.PaginaVendedorResumen,
      ),
  },
  {
    path: 'tiendas',
    loadComponent: () =>
      import('./paginas/pagina-vendedor-tiendas/pagina-vendedor-tiendas').then(
        (m) => m.PaginaVendedorTiendas,
      ),
  },
  {
    path: 'tiendas/:idTienda/productos/nuevo',
    loadComponent: () =>
      import('./paginas/pagina-vendedor-productos/pagina-vendedor-productos').then(
        (m) => m.PaginaVendedorProductos,
      ),
  },
  {
    path: 'tiendas/:idTienda/productos/:idProducto/editar',
    loadComponent: () =>
      import('./paginas/pagina-vendedor-productos/pagina-vendedor-productos').then(
        (m) => m.PaginaVendedorProductos,
      ),
  },
  {
    path: 'tiendas/:idTienda/pedidos',
    loadComponent: () =>
      import('./paginas/pagina-vendedor-pedidos/pagina-vendedor-pedidos').then(
        (m) => m.PaginaVendedorPedidos,
      ),
  },
  {
    path: 'tiendas/:idTienda',
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
    loadComponent: () =>
      import('./paginas/pagina-vendedor-pedidos/pagina-vendedor-pedidos').then(
        (m) => m.PaginaVendedorPedidos,
      ),
  },
];
