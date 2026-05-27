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
        path: 'match',
        loadComponent: () => import('./features/builder/builder').then((m) => m.BuilderComponent),
      },
      {
        path: 'catalogo',
        loadComponent: () => import('./features/catalog/catalog').then((m) => m.CatalogComponent),
      },
      {
        path: 'proveedores',
        loadComponent: () =>
          import('./features/manual-builder/manual-builder').then((m) => m.ManualBuilderComponent),
      },
      {
        path: 'panel',
        loadComponent: () =>
          import('./features/marketplace-quotes/marketplace-quotes').then((m) => m.MarketplaceQuotesComponent),
      },
      { path: 'builder', redirectTo: 'match', pathMatch: 'full' },
      { path: 'catalog', redirectTo: 'catalogo', pathMatch: 'full' },
      { path: 'manual-builder', redirectTo: 'proveedores', pathMatch: 'full' },
      { path: 'marketplace-quotes', redirectTo: 'panel', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '' },
];
