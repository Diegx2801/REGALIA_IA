import { Routes } from '@angular/router';
import { autenticacionGuard } from './core/guards/autenticacion.guard';
import { rolGuard } from './core/guards/rol.guard';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Acceso de clientes y vendedores | REGALIA',
    loadChildren: () =>
      import('./domains/autenticacion/autenticacion.routes').then((m) => m.AUTENTICACION_ROUTES),
  },
  {
    path: 'admin/login',
    title: 'Acceso administrativo | REGALIA',
    loadComponent: () =>
      import('./domains/autenticacion/paginas/pagina-admin-login/pagina-admin-login').then(
        (m) => m.PaginaAdminLogin,
      ),
  },
  {
    path: '',
    // Layout publico: landing y catalogo comparten navegacion comercial.
    loadComponent: () =>
      import('./core/layouts/layout-publico/layout-publico').then((m) => m.LayoutPublico),
    children: [
      {
        path: '',
        title: 'Regalos personalizados y tiendas locales | REGALIA',
        loadComponent: () =>
          import('./pages/inicio/pagina-inicio/pagina-inicio').then((m) => m.PaginaInicio),
      },
      {
        path: 'verificar-correo',
        title: 'Verificar correo | REGALIA',
        loadComponent: () =>
          import('./domains/autenticacion/paginas/pagina-verificar-correo/pagina-verificar-correo').then(
            (m) => m.PaginaVerificarCorreo,
          ),
      },
      {
        path: 'restablecer-contrasena',
        title: 'Restablecer contraseña | REGALIA',
        loadComponent: () =>
          import('./domains/autenticacion/paginas/pagina-recuperar-contrasena/pagina-recuperar-contrasena').then(
            (m) => m.PaginaRecuperarContrasena,
          ),
      },
      {
        path: 'catalogo',
        loadChildren: () =>
          import('./domains/catalogo/catalogo.routes').then((m) => m.CATALOGO_ROUTES),
      },
      {
        path: 'pedir-con-ia',
        title: 'Encuentra un regalo con IA | REGALIA',
        loadComponent: () =>
          import('./pages/pedir-con-ia/pagina-pedir-con-ia/pagina-pedir-con-ia').then(
            (m) => m.PaginaPedirConIa,
          ),
      },
      {
        path: 'vendedores',
        title: 'Vendedores y tiendas | REGALIA',
        loadComponent: () =>
          import('./domains/catalogo/paginas/pagina-catalogo/pagina-catalogo').then(
            (m) => m.PaginaCatalogo,
          ),
      },
      {
        path: 'vender',
        title: 'Abre tu tienda | REGALIA',
        loadComponent: () =>
          import('./domains/vendedores/onboarding/paginas/pagina-empezar-a-vender/pagina-empezar-a-vender').then(
            (m) => m.PaginaEmpezarAVender,
          ),
      },
      {
        path: 'modelo',
        title: 'Cómo funciona | REGALIA',
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
        title: 'Carrito de compras | REGALIA',
        loadComponent: () =>
          import('./domains/checkout/paginas/pagina-carrito/pagina-carrito').then(
            (m) => m.PaginaCarrito,
          ),
      },
      {
        path: 'acceso-denegado',
        title: 'Acceso no disponible | REGALIA',
        loadComponent: () =>
          import('./pages/acceso-denegado/pagina-acceso-denegado/pagina-acceso-denegado').then(
            (m) => m.PaginaAccesoDenegado,
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
    loadChildren: () => import('./domains/usuarios/usuarios.routes').then((m) => m.USUARIOS_ROUTES),
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
      import('./domains/administracion/administracion.routes').then((m) => m.ADMINISTRACION_ROUTES),
  },
  {
    path: '**',
    title: 'Página no encontrada | REGALIA',
    loadComponent: () =>
      import('./pages/no-encontrado/pagina-no-encontrado/pagina-no-encontrado').then(
        (m) => m.PaginaNoEncontrado,
      ),
  },
];
