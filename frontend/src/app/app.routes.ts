import { Routes } from '@angular/router';

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
        loadComponent: () =>
          import('./features/marketplace-quotes/marketplace-quotes').then((m) => m.MarketplaceQuotesComponent),
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
