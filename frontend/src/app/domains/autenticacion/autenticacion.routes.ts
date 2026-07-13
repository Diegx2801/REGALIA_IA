import { Routes } from '@angular/router';

export const AUTENTICACION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./paginas/pagina-login/pagina-login').then((m) => m.PaginaLogin),
  },
];
