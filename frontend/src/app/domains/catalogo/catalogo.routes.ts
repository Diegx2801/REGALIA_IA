import { Routes } from '@angular/router';

export const CATALOGO_ROUTES: Routes = [
  {
    path: '',
    title: 'Catálogo de regalos | REGALIA',
    loadComponent: () =>
      import('./paginas/pagina-catalogo/pagina-catalogo').then((m) => m.PaginaCatalogo),
  },
  {
    path: ':idProducto',
    title: 'Detalle del regalo | REGALIA',
    loadComponent: () =>
      import('./paginas/pagina-detalle-producto/pagina-detalle-producto').then(
        (m) => m.PaginaDetalleProducto,
      ),
  },
];
