import { Routes } from '@angular/router';

export const VENDEDORES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./paginas/pagina-panel-vendedor/pagina-panel-vendedor').then(
        (m) => m.PaginaPanelVendedor,
      ),
  },
];
