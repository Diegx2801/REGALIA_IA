import { Routes } from '@angular/router';
import {
  adminGuestGuard,
  authGuard,
  guestGuard,
  roleGuard,
  roleRedirectGuard,
} from './core/guards/auth.guard';
import { devPreviewGuard } from './core/guards/dev-preview.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/auth').then((m) => m.AuthComponent),
  },
  {
    path: 'registro',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/auth').then((m) => m.AuthComponent),
  },

  {
    path: 'admin/login',
    canActivate: [adminGuestGuard],
    loadComponent: () =>
      import('./features/admin-login/admin-login').then((m) => m.AdminLoginComponent),
  },

  {
    path: 'vista-previa',
    canActivate: [devPreviewGuard],
    loadComponent: () =>
      import('./features/role-preview/role-preview').then((m) => m.RolePreviewComponent),
  },
  {
    path: 'vista-previa/cliente',
    canActivate: [devPreviewGuard],
    data: { previewRole: 'Cliente' },
    loadComponent: () =>
      import('./core/layouts/workspace-layout/workspace-layout').then(
        (m) => m.WorkspaceLayoutComponent,
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/dashboard/dashboard').then((m) => m.DashboardComponent),
      },
    ],
  },
  {
    path: 'vista-previa/proveedor',
    canActivate: [devPreviewGuard],
    data: { previewRole: 'Proveedor' },
    loadComponent: () =>
      import('./core/layouts/workspace-layout/workspace-layout').then(
        (m) => m.WorkspaceLayoutComponent,
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/dashboard/dashboard').then((m) => m.DashboardComponent),
      },
    ],
  },
  {
    path: 'vista-previa/admin',
    canActivate: [devPreviewGuard],
    data: { previewRole: 'Administrador' },
    loadComponent: () =>
      import('./core/layouts/workspace-layout/workspace-layout').then(
        (m) => m.WorkspaceLayoutComponent,
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/dashboard/dashboard').then((m) => m.DashboardComponent),
      },
    ],
  },
  {
    path: 'acceso-denegado',
    loadComponent: () =>
      import('./features/access-denied/access-denied').then((m) => m.AccessDeniedComponent),
  },

  {
    path: 'cliente',
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['Cliente'],
      authContext: 'PUBLIC',
    },
    loadComponent: () =>
      import('./core/layouts/workspace-layout/workspace-layout').then(
        (m) => m.WorkspaceLayoutComponent,
      ),
    children: [
      {
        path: 'inicio',
        loadComponent: () =>
          import('./features/dashboard/dashboard').then((m) => m.DashboardComponent),
      },
      {
        path: 'explorar',
        loadComponent: () => import('./features/catalog/catalog').then((m) => m.CatalogComponent),
      },
      {
        path: 'carrito',
        loadComponent: () => import('./features/cart/cart').then((m) => m.CartComponent),
      },
      {
        path: 'solicitud',
        loadComponent: () => import('./features/builder/builder').then((m) => m.BuilderComponent),
      },
      {
        path: 'reservas',
        loadComponent: () =>
          import('./features/reservations/reservations').then((m) => m.ReservationsComponent),
      },
      {
        path: 'solicitud-proveedor',
        loadComponent: () =>
          import('./features/provider-application/provider-application').then(
            (m) => m.ProviderApplicationComponent,
          ),
      },
      {
        path: 'perfil',
        loadComponent: () =>
          import('./features/account-profile/account-profile').then(
            (m) => m.AccountProfileComponent,
          ),
      },
      { path: '', redirectTo: 'inicio', pathMatch: 'full' },
    ],
  },

  {
    path: 'proveedor',
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['Proveedor'],
      authContext: 'PUBLIC',
    },
    loadComponent: () =>
      import('./core/layouts/workspace-layout/workspace-layout').then(
        (m) => m.WorkspaceLayoutComponent,
      ),
    children: [
      {
        path: 'resumen',
        loadComponent: () =>
          import('./features/dashboard/dashboard').then((m) => m.DashboardComponent),
      },
      {
        path: 'pedidos',
        loadComponent: () =>
          import('./features/marketplace-quotes/marketplace-quotes').then(
            (m) => m.MarketplaceQuotesComponent,
          ),
      },
      {
        path: 'calendario',
        loadComponent: () =>
          import('./features/reservations/reservations').then((m) => m.ReservationsComponent),
      },
      {
        path: 'perfil',
        loadComponent: () =>
          import('./features/provider-profile/provider-profile').then(
            (m) => m.ProviderProfileComponent,
          ),
      },
      {
        path: 'cuenta',
        loadComponent: () =>
          import('./features/account-profile/account-profile').then(
            (m) => m.AccountProfileComponent,
          ),
      },
      { path: '', redirectTo: 'resumen', pathMatch: 'full' },
    ],
  },

  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['Administrador'],
      authContext: 'ADMIN',
    },
    loadComponent: () =>
      import('./core/layouts/workspace-layout/workspace-layout').then(
        (m) => m.WorkspaceLayoutComponent,
      ),
    children: [
      {
        path: 'resumen',
        loadComponent: () =>
          import('./features/dashboard/dashboard').then((m) => m.DashboardComponent),
      },
      {
        path: 'operacion',
        loadComponent: () =>
          import('./features/marketplace-quotes/marketplace-quotes').then(
            (m) => m.MarketplaceQuotesComponent,
          ),
      },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./features/admin-users/admin-users').then((m) => m.AdminUsersComponent),
      },
      {
        path: 'solicitudes-proveedor',
        loadComponent: () =>
          import('./features/admin-provider-applications/admin-provider-applications').then(
            (m) => m.AdminProviderApplicationsComponent,
          ),
      },
      {
        path: 'calendario',
        loadComponent: () =>
          import('./features/reservations/reservations').then((m) => m.ReservationsComponent),
      },
      {
        path: 'perfil',
        loadComponent: () =>
          import('./features/account-profile/account-profile').then(
            (m) => m.AccountProfileComponent,
          ),
      },
      { path: '', redirectTo: 'resumen', pathMatch: 'full' },
    ],
  },

  {
    path: 'dashboard',
    canActivate: [authGuard, roleRedirectGuard],
    data: {
      redirects: {
        Cliente: '/cliente/inicio',
        Proveedor: '/proveedor/resumen',
        Administrador: '/admin/resumen',
      },
    },
    loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.DashboardComponent),
  },
  {
    path: 'panel',
    canActivate: [authGuard, roleRedirectGuard],
    data: {
      redirects: {
        Cliente: '/cliente/inicio',
        Proveedor: '/proveedor/pedidos',
        Administrador: '/admin/operacion',
      },
    },
    loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.DashboardComponent),
  },
  {
    path: 'mis-reservas',
    canActivate: [authGuard, roleRedirectGuard],
    data: {
      redirects: {
        Cliente: '/cliente/reservas',
        Proveedor: '/proveedor/calendario',
        Administrador: '/admin/calendario',
      },
    },
    loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.DashboardComponent),
  },
  {
    path: 'perfil-proveedor',
    canActivate: [authGuard, roleRedirectGuard],
    data: {
      redirects: {
        Cliente: '/cliente/inicio',
        Proveedor: '/proveedor/perfil',
        Administrador: '/admin/resumen',
      },
    },
    loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.DashboardComponent),
  },

  { path: 'marketplace-quotes', redirectTo: 'panel', pathMatch: 'full' },

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
        path: 'producto/:id',
        loadComponent: () =>
          import('./features/product-detail/product-detail').then((m) => m.ProductDetailComponent),
      },
      {
        path: 'carrito',
        loadComponent: () => import('./features/cart/cart').then((m) => m.CartComponent),
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
        path: 'modelo',
        loadComponent: () => import('./features/landing/landing').then((m) => m.LandingComponent),
      },
      { path: 'match', redirectTo: 'pedir-con-ia', pathMatch: 'full' },
      { path: 'builder', redirectTo: 'pedir-con-ia', pathMatch: 'full' },
      { path: 'catalog', redirectTo: 'catalogo', pathMatch: 'full' },
      { path: 'manual-builder', redirectTo: 'manual', pathMatch: 'full' },
    ],
  },

  { path: '**', redirectTo: '' },
];