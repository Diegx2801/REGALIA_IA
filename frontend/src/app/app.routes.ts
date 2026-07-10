import { Routes } from '@angular/router';
import { autenticacionGuard } from './core/guards/autenticacion.guard';
import { rolGuard } from './core/guards/rol.guard';

export const routes: Routes = [
  {
    path: '',
    // Layout publico: landing, catalogo y login comparten navegacion comercial.
    loadComponent: () =>
      import('./core/layouts/layout-publico/layout-publico').then((m) => m.LayoutPublico),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/inicio/pagina-inicio/pagina-inicio').then((m) => m.PaginaInicio),
      },
      {
        path: 'login',
        loadChildren: () =>
          import('./domains/autenticacion/autenticacion.routes').then(
            (m) => m.AUTENTICACION_ROUTES,
          ),
      },
      {
        path: 'catalogo',
        loadChildren: () =>
          import('./domains/catalogo/catalogo.routes').then((m) => m.CATALOGO_ROUTES),
      },
      {
        path: 'pedir-con-ia',
        loadComponent: () =>
          import('./pages/pedir-con-ia/pagina-pedir-con-ia/pagina-pedir-con-ia').then(
            (m) => m.PaginaPedirConIa,
          ),
      },
      {
        path: 'vendedores',
        loadComponent: () =>
          import('./domains/catalogo/paginas/pagina-catalogo/pagina-catalogo').then(
            (m) => m.PaginaCatalogo,
          ),
      },
      {
        path: 'modelo',
        loadComponent: () =>
          import('./pages/inicio/pagina-inicio/pagina-inicio').then((m) => m.PaginaInicio),
      },
      {
        path: 'checkout',
        loadChildren: () =>
          import('./domains/checkout/checkout.routes').then((m) => m.CHECKOUT_ROUTES),
      },
      {
        path: 'carrito',
        loadComponent: () =>
          import('./domains/checkout/paginas/pagina-carrito/pagina-carrito').then(
            (m) => m.PaginaCarrito,
          ),
      },
    ],
  },
  {
    path: 'cliente',
    // Rutas privadas: primero validan sesion y luego rol permitido.
    canActivate: [autenticacionGuard, rolGuard],
    data: { roles: ['CLIENTE'] },
    loadComponent: () =>
      import('./core/layouts/layout-cliente/layout-cliente').then((m) => m.LayoutCliente),
    loadChildren: () =>
      import('./domains/usuarios/usuarios.routes').then((m) => m.USUARIOS_ROUTES),
  },
  {
    path: 'vendedor',
    // El dominio vendedor queda separado para crecer sin acoplarse al panel cliente.
    canActivate: [autenticacionGuard, rolGuard],
    data: { roles: ['VENDEDOR'] },
    loadComponent: () =>
      import('./core/layouts/layout-vendedor/layout-vendedor').then((m) => m.LayoutVendedor),
    loadChildren: () =>
      import('./domains/vendedores/vendedores.routes').then((m) => m.VENDEDORES_ROUTES),
  },
  {
    path: 'admin',
    // Backoffice aislado: consume endpoints /api/admin y tendra UI mas densa.
    canActivate: [autenticacionGuard, rolGuard],
    data: { roles: ['ADMIN'] },
    loadComponent: () =>
      import('./core/layouts/layout-administracion/layout-administracion').then(
        (m) => m.LayoutAdministracion,
      ),
    loadChildren: () =>
      import('./domains/administracion/administracion.routes').then(
        (m) => m.ADMINISTRACION_ROUTES,
      ),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./pages/no-encontrado/pagina-no-encontrado/pagina-no-encontrado').then(
        (m) => m.PaginaNoEncontrado,
      ),
  },
];
