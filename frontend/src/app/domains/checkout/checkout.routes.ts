import { Routes } from '@angular/router';

export const CHECKOUT_ROUTES: Routes = [
  {
    path: 'carrito',
    title: 'Entrega y pago | REGALIA',
    loadComponent: () =>
      import('./paginas/pagina-solicitud-checkout/pagina-solicitud-checkout').then(
        (m) => m.PaginaSolicitudCheckout,
      ),
  },
  {
    path: 'solicitud/:idProducto',
    title: 'Personalizar solicitud | REGALIA',
    loadComponent: () =>
      import('./paginas/pagina-solicitud-checkout/pagina-solicitud-checkout').then(
        (m) => m.PaginaSolicitudCheckout,
      ),
  },
];
