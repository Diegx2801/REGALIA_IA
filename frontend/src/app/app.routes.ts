import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./core/layouts/public-layout/public-layout').then((m) => m.PublicLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/landing/landing').then((m) => m.LandingComponent),
      },
      {
        path: 'pedir-con-ia',
        loadComponent: () => import('./features/builder/builder').then((m) => m.BuilderComponent),
      },
      {
        path: 'catalogo',
        loadComponent: () => import('./features/catalog/catalog').then((m) => m.CatalogComponent),
      },
      {
        path: 'proveedores',
        loadComponent: () => import('./features/catalog/catalog').then((m) => m.CatalogComponent),
      },
      {
        path: 'manual',
        loadComponent: () =>
          import('./features/manual-builder/manual-builder').then((m) => m.ManualBuilderComponent),
      },
      {
        path: 'panel',
        // Panel operativo restringido a roles que gestionan pedidos y comisiones.
        canActivate: [roleGuard],
        data: { roles: ['Proveedor', 'Administrador'] },
        loadComponent: () =>
          import('./features/marketplace-quotes/marketplace-quotes').then((m) => m.MarketplaceQuotesComponent),
      },
      {
        path: 'login',
        loadComponent: () => import('./features/auth/auth').then((m) => m.AuthComponent),
      },
      {
        path: 'registro',
        loadComponent: () => import('./features/auth/auth').then((m) => m.AuthComponent),
      },
      {
        path: 'dashboard',
        // Vista inicial posterior al login; su contenido cambia segun el rol mock.
        canActivate: [authGuard],
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.DashboardComponent),
      },
      {
        path: 'mis-reservas',
        // Calendario de reservas compartido por cliente, proveedor y administrador.
        canActivate: [authGuard],
        loadComponent: () => import('./features/reservations/reservations').then((m) => m.ReservationsComponent),
      },
      {
        path: 'perfil-proveedor',
        // Espacio donde proveedores publican productos y gestionan su catalogo local.
        canActivate: [roleGuard],
        data: { roles: ['Proveedor', 'Administrador'] },
        loadComponent: () =>
          import('./features/provider-profile/provider-profile').then((m) => m.ProviderProfileComponent),
      },
      {
        path: 'admin/usuarios',
        // Administracion mock de usuarios y roles; solo disponible para administrador.
        canActivate: [roleGuard],
        data: { roles: ['Administrador'] },
        loadComponent: () => import('./features/admin-users/admin-users').then((m) => m.AdminUsersComponent),
      },
      {
        path: 'modelo',
        loadComponent: () => import('./features/landing/landing').then((m) => m.LandingComponent),
      },
      { path: 'match', redirectTo: 'pedir-con-ia', pathMatch: 'full' },
      { path: 'builder', redirectTo: 'pedir-con-ia', pathMatch: 'full' },
      { path: 'catalog', redirectTo: 'catalogo', pathMatch: 'full' },
      { path: 'manual-builder', redirectTo: 'manual', pathMatch: 'full' },
      { path: 'marketplace-quotes', redirectTo: 'panel', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '' },
];
