import { Routes } from '@angular/router';

export const USUARIOS_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'pedidos',
  },
  {
    path: 'perfil',
    loadComponent: () =>
      import('./paginas/pagina-cliente-perfil/pagina-cliente-perfil').then(
        (m) => m.PaginaClientePerfil,
      ),
  },
  {
    path: 'pedidos',
    loadComponent: () =>
      import('./paginas/pagina-cliente-pedidos/pagina-cliente-pedidos').then(
        (m) => m.PaginaClientePedidos,
      ),
  },
  {
    path: 'pedidos/:idPedido',
    loadComponent: () =>
      import('./paginas/pagina-cliente-detalle-pedido/pagina-cliente-detalle-pedido').then(
        (m) => m.PaginaClienteDetallePedido,
      ),
  },
];
