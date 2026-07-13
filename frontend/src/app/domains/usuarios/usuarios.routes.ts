import { Routes } from '@angular/router';

export const USUARIOS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./paginas/pagina-panel-cliente/pagina-panel-cliente').then(
        (m) => m.PaginaPanelCliente,
      ),
  },
];
