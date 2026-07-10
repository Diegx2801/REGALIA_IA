import { Routes } from '@angular/router';

export const CHECKOUT_ROUTES: Routes = [
  {
    path: 'carrito',
    loadComponent: () =>
      import('./paginas/pagina-solicitud-checkout/pagina-solicitud-checkout').then(
        (m) => m.PaginaSolicitudCheckout,
      ),
  },
  {
    path: 'solicitud/:idProducto',
    loadComponent: () =>
      import('./paginas/pagina-solicitud-checkout/pagina-solicitud-checkout').then(
        (m) => m.PaginaSolicitudCheckout,
      ),
  },
];
