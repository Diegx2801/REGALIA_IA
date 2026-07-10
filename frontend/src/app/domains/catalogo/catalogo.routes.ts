import { Routes } from '@angular/router';

export const CATALOGO_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./paginas/pagina-catalogo/pagina-catalogo').then((m) => m.PaginaCatalogo),
  },
  {
    path: ':idProducto',
    loadComponent: () =>
      import('./paginas/pagina-detalle-producto/pagina-detalle-producto').then(
        (m) => m.PaginaDetalleProducto,
      ),
  },
];
