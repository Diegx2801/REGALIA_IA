import { Routes } from '@angular/router';

export const USUARIOS_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'pedidos',
  },
  {
    path: 'perfil',
    title: 'Mi perfil | REGALIA',
    loadComponent: () =>
      import('./paginas/pagina-cliente-perfil/pagina-cliente-perfil').then(
        (m) => m.PaginaClientePerfil,
      ),
  },
  {
    path: 'pedidos',
    title: 'Mis pedidos | REGALIA',
    loadComponent: () =>
      import('./paginas/pagina-cliente-pedidos/pagina-cliente-pedidos').then(
        (m) => m.PaginaClientePedidos,
      ),
  },
  {
    path: 'pedidos/:idPedido',
    title: 'Detalle del pedido | REGALIA',
    loadComponent: () =>
      import('./paginas/pagina-cliente-detalle-pedido/pagina-cliente-detalle-pedido').then(
        (m) => m.PaginaClienteDetallePedido,
      ),
  },
];
