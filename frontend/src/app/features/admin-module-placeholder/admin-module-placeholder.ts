import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

type AdminModuleKey = 'stores' | 'sellers' | 'catalogs';

interface AdminModuleView {
  eyebrow: string;
  title: string;
  description: string;
  primaryRoute: string;
  primaryLabel: string;
  endpoints: string[];
  nextSteps: string[];
}

const ADMIN_MODULES: Record<AdminModuleKey, AdminModuleView> = {
  stores: {
    eyebrow: 'Revision comercial',
    title: 'Tiendas',
    description:
      'Controla estados de revision, visibilidad publica y acciones de confianza sobre las tiendas del marketplace.',
    primaryRoute: '/admin/resumen',
    primaryLabel: 'Volver al resumen',
    endpoints: [
      'GET /api/admin/tiendas',
      'GET /api/admin/tiendas/{id}',
      'PATCH /api/admin/tiendas/{id}/aprobar',
      'PATCH /api/admin/tiendas/{id}/observar',
      'PATCH /api/admin/tiendas/{id}/rechazar',
      'PATCH /api/admin/tiendas/{id}/pendiente',
    ],
    nextSteps: [
      'Conectar listado real con filtros por estado de revision.',
      'Agregar panel de detalle para aprobar, observar, rechazar o devolver a pendiente.',
      'Mantener solo tiendas aprobadas visibles en el marketplace publico.',
    ],
  },
  sellers: {
    eyebrow: 'Gestion comercial',
    title: 'Vendedores',
    description:
      'Supervisa perfiles vendedores, estado comercial y cantidad de tiendas asociadas sin mezclarlo con cuentas cliente.',
    primaryRoute: '/admin/resumen',
    primaryLabel: 'Volver al resumen',
    endpoints: ['GET /api/admin/vendedores', 'GET /api/admin/vendedores/{id}'],
    nextSteps: [
      'Conectar listado real de vendedores.',
      'Mostrar verificacion, tiendas activas y tiendas totales.',
      'Separar revision de vendedor y revision de tienda para evitar responsabilidades mezcladas.',
    ],
  },
  catalogs: {
    eyebrow: 'Configuracion del marketplace',
    title: 'Catalogos',
    description:
      'Agrupa mantenedores pequeños en una sola pantalla con pestanas internas para reducir ruido operativo.',
    primaryRoute: '/admin/resumen',
    primaryLabel: 'Volver al resumen',
    endpoints: [
      'GET /api/admin/rubros',
      'GET /api/admin/tipos-producto',
      'GET /api/admin/tipos-entrega',
      'GET /api/admin/tipos-pago',
      'GET /api/admin/tipos-documento',
    ],
    nextSteps: [
      'Crear tabs por mantenedor.',
      'Permitir lectura y edicion controlada segun criticidad del dato maestro.',
      'Evitar acciones destructivas amplias sobre datos maestros usados por pedidos, tiendas o productos.',
    ],
  },
};

@Component({
  selector: 'app-admin-module-placeholder',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './admin-module-placeholder.html',
  styleUrl: './admin-module-placeholder.css',
})
export class AdminModulePlaceholderComponent {
  private readonly route = inject(ActivatedRoute);

  readonly module = computed(() => {
    const key = this.route.snapshot.data['adminModule'] as AdminModuleKey | undefined;
    return ADMIN_MODULES[key ?? 'stores'];
  });
}
