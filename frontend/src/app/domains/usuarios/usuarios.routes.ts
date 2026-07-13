import { Routes } from '@angular/router';

export const USUARIOS_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'resumen',
  },
  {
    path: 'resumen',
    loadComponent: () =>
      import('./paginas/pagina-cliente-resumen/pagina-cliente-resumen').then(
        (m) => m.PaginaClienteResumen,
      ),
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
    path: 'pagos',
    loadComponent: () =>
      import('./paginas/pagina-cliente-pagos/pagina-cliente-pagos').then(
        (m) => m.PaginaClientePagos,
      ),
  },
];
