import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  PREVIEW_IDENTITIES,
  PREVIEW_ROUTES,
  WorkspaceIdentity,
} from '../../core/config/workspace-preview.config';
import { AuthSessionService } from '../../core/services/auth/auth-session.service';
import { UserRole } from '../../core/services/auth/auth-session.model';
import {
  AdminSummary,
  AdminSummaryAlert,
} from '../../core/services/data-access/regalia/models/admin-summary.model';
import { RegaliaAdminSummaryApiService } from '../../core/services/data-access/regalia/services/regalia-admin-summary-api.service';

interface DashboardMetric {
  label: string;
  value: string;
  hint: string;
  trend?: string;
}

interface DashboardAction {
  label: string;
  hint: string;
  route: string;
  icon: string;
}

interface DashboardActivity {
  title: string;
  meta: string;
  status: string;
  tone: 'neutral' | 'success' | 'warning';
  route?: string;
}

interface DashboardView {
  eyebrow: string;
  title: string;
  text: string;
  primaryLabel: string;
  primaryRoute: string;
  metrics: DashboardMetric[];
  actions: DashboardAction[];
  activityTitle: string;
  activityDescription: string;
  activities: DashboardActivity[];
  emptyTitle: string;
  emptyText: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent implements OnInit {
  private readonly authSession = inject(AuthSessionService);
  private readonly route = inject(ActivatedRoute);
<<<<<<< HEAD
  private readonly adminSummaryApi = inject(RegaliaAdminSummaryApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly previewRole = (this.route.parent?.snapshot.data['previewRole'] ?? null) as UserRole | null;
=======
  private readonly previewRole = (this.route.parent?.snapshot.data['previewRole'] ??
    null) as UserRole | null;
>>>>>>> origin/main

  readonly isPreview = this.previewRole !== null;
  readonly role = computed<UserRole>(() => this.previewRole ?? this.authSession.role() ?? 'Cliente');
  readonly adminSummary = signal<AdminSummary | null>(null);
  readonly adminSummaryLoading = signal(false);
  readonly adminSummaryError = signal('');
  readonly previewHome = computed(() => PREVIEW_ROUTES[this.role()]);
  readonly user = computed<WorkspaceIdentity | null>(() => {
    if (this.isPreview) return PREVIEW_IDENTITIES[this.role()];
    return this.authSession.currentUser();
  });
  readonly firstName = computed(() => this.user()?.fullName.split(/\s+/)[0] ?? 'Hola');
  readonly todayLabel = new Intl.DateTimeFormat('es-PE', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
  }).format(new Date());

  readonly view = computed<DashboardView>(() => {
    const role = this.role();
    if (role === 'Vendedor') return this.sellerView();
    if (role === 'Administrador') return this.adminView();
    return this.clientView();
  });

  ngOnInit(): void {
    if (this.role() === 'Administrador' && !this.isPreview) {
      this.loadAdminSummary();
    }
  }

  actionRoute(route: string): string {
    return this.isPreview ? this.previewHome() : route;
  }

  refreshAdminSummary(): void {
    this.loadAdminSummary();
  }

  private clientView(): DashboardView {
    const demo = this.isPreview;
    return {
      eyebrow: 'Panel cliente',
      title: `Hola, ${this.firstName()}. Encuentra un detalle que se sienta realmente personal.`,
      text: 'Explora vendedores locales, publica una necesidad y compara propuestas con total claridad antes de reservar.',
      primaryLabel: 'Crear una solicitud',
      primaryRoute: '/cliente/solicitud',
      metrics: [
        {
          label: 'Solicitudes activas',
          value: demo ? '1' : '0',
          hint: demo ? 'Esperando nuevas cotizaciones' : 'Aun no has publicado solicitudes',
        },
        {
          label: 'Cotizaciones recibidas',
          value: demo ? '2' : '0',
          hint: demo ? 'Listas para comparar' : 'Apareceran cuando un vendedor responda',
        },
        {
          label: 'Reservas confirmadas',
          value: demo ? '1' : '0',
          hint: demo ? 'Entrega programada esta semana' : 'Tus reservas se mostraran aqui',
        },
        {
          label: 'Favoritos',
          value: demo ? '3' : '0',
          hint: demo ? 'Vendedores guardados' : 'Guarda opciones para compararlas luego',
        },
      ],
      actions: [
<<<<<<< HEAD
        { label: 'Explorar regalos', hint: 'Catalogo y vendedores verificados', route: '/cliente/explorar', icon: 'E' },
        { label: 'Pedir con IA', hint: 'Describe lo que necesitas en tus palabras', route: '/cliente/solicitud', icon: 'IA' },
        { label: 'Ver mis reservas', hint: 'Fechas, estados y seguimiento', route: '/cliente/reservas', icon: 'R' },
        { label: 'Vender en REGALIA', hint: 'Postula tu negocio y crea tu perfil comercial', route: '/cliente/solicitud-vendedor', icon: 'V' },
=======
        {
          label: 'Explorar regalos',
          hint: 'Catálogo y proveedores verificados',
          route: '/cliente/explorar',
          icon: '◈',
        },
        {
          label: 'Pedir con IA',
          hint: 'Describe lo que necesitas en tus palabras',
          route: '/cliente/solicitud',
          icon: '✦',
        },
        {
          label: 'Ver mis reservas',
          hint: 'Fechas, estados y seguimiento',
          route: '/cliente/reservas',
          icon: '◫',
        },
        {
          label: 'Vender en REGALIA',
          hint: 'Postula tu negocio y crea tu perfil comercial',
          route: '/cliente/solicitud-proveedor',
          icon: '✧',
        },
>>>>>>> origin/main
      ],
      activityTitle: 'Actividad reciente',
      activityDescription: 'Solo se muestran acciones vinculadas a tu cuenta.',
      activities: demo
        ? [
            {
              title: 'Regalo de graduacion elegante',
              meta: '2 vendedores enviaron una propuesta',
              status: 'Comparar',
              tone: 'warning',
            },
            {
              title: 'Box de aniversario personalizado',
              meta: 'Entrega programada - sabado 6:00 p. m.',
              status: 'Confirmada',
              tone: 'success',
            },
          ]
        : [],
<<<<<<< HEAD
      emptyTitle: 'Tu espacio esta listo',
      emptyText: 'Empieza creando una solicitud o guardando un vendedor. No mostraremos actividad ficticia en tu cuenta.',
=======
      emptyTitle: 'Tu espacio está listo',
      emptyText:
        'Empieza creando una solicitud o guardando un proveedor. No mostraremos actividad ficticia en tu cuenta.',
>>>>>>> origin/main
    };
  }

  private sellerView(): DashboardView {
    const demo = this.isPreview;
    return {
      eyebrow: 'Panel vendedor',
      title: `Buenos dias, ${this.firstName()}. Convierte nuevas solicitudes en experiencias memorables.`,
      text: 'Prioriza oportunidades compatibles, organiza entregas y manten la reputacion de tu negocio en un solo lugar.',
      primaryLabel: 'Revisar solicitudes',
      primaryRoute: '/vendedor/pedidos',
      metrics: [
<<<<<<< HEAD
        { label: 'Solicitudes nuevas', value: demo ? '4' : '0', hint: demo ? '2 con alta compatibilidad' : 'Sin solicitudes nuevas' },
        { label: 'Pedidos en proceso', value: demo ? '6' : '0', hint: demo ? '3 entregas esta semana' : 'Sin pedidos activos' },
        { label: 'Ventas potenciales', value: demo ? 'S/ 1,240' : 'S/ 0', hint: demo ? 'Cotizaciones abiertas' : 'Aun no hay cotizaciones' },
        { label: 'Reputacion', value: demo ? '4.9' : '-', hint: demo ? '96 resenas verificadas' : 'Se calculara con resenas reales' },
      ],
      actions: [
        { label: 'Gestionar pedidos', hint: 'Cotiza, acepta y actualiza estados', route: '/vendedor/pedidos', icon: 'P' },
        { label: 'Organizar calendario', hint: 'Entregas, cupos y disponibilidad', route: '/vendedor/calendario', icon: 'C' },
        { label: 'Mejorar mi perfil', hint: 'Catalogo, portafolio y zonas', route: '/vendedor/perfil', icon: 'M' },
=======
        {
          label: 'Solicitudes nuevas',
          value: demo ? '4' : '0',
          hint: demo ? '2 con alta compatibilidad' : 'Sin solicitudes nuevas',
        },
        {
          label: 'Pedidos en proceso',
          value: demo ? '6' : '0',
          hint: demo ? '3 entregas esta semana' : 'Sin pedidos activos',
        },
        {
          label: 'Ventas potenciales',
          value: demo ? 'S/ 1,240' : 'S/ 0',
          hint: demo ? 'Cotizaciones abiertas' : 'Aún no hay cotizaciones',
        },
        {
          label: 'Reputación',
          value: demo ? '4.9' : '—',
          hint: demo ? '96 reseñas verificadas' : 'Se calculará con reseñas reales',
        },
      ],
      actions: [
        {
          label: 'Gestionar pedidos',
          hint: 'Cotiza, acepta y actualiza estados',
          route: '/proveedor/pedidos',
          icon: '◈',
        },
        {
          label: 'Organizar calendario',
          hint: 'Entregas, cupos y disponibilidad',
          route: '/proveedor/calendario',
          icon: '◫',
        },
        {
          label: 'Mejorar mi perfil',
          hint: 'Catálogo, portafolio y zonas',
          route: '/proveedor/perfil',
          icon: '▦',
        },
>>>>>>> origin/main
      ],
      activityTitle: 'Oportunidades prioritarias',
      activityDescription: 'Ordenadas por compatibilidad, urgencia y fecha de entrega.',
      activities: demo
        ? [
<<<<<<< HEAD
            { title: 'Box de cumpleanos - Victor Larco', meta: 'Presupuesto S/ 120 - entrega manana', status: '96% compatible', tone: 'success' },
            { title: 'Detalle corporativo - Centro', meta: '20 unidades - cotizacion abierta', status: 'Cotizar hoy', tone: 'warning' },
            { title: 'Desayuno sorpresa - California', meta: 'Presupuesto S/ 85 - sabado', status: 'Nueva', tone: 'neutral' },
          ]
        : [],
      emptyTitle: 'Aun no hay oportunidades asignadas',
      emptyText: 'Cuando el modulo de solicitudes del backend este disponible, aqui apareceran unicamente pedidos compatibles con tu perfil.',
=======
            {
              title: 'Box de cumpleaños · Víctor Larco',
              meta: 'Presupuesto S/ 120 · entrega mañana',
              status: '96% compatible',
              tone: 'success',
            },
            {
              title: 'Detalle corporativo · Centro',
              meta: '20 unidades · cotización abierta',
              status: 'Cotizar hoy',
              tone: 'warning',
            },
            {
              title: 'Desayuno sorpresa · California',
              meta: 'Presupuesto S/ 85 · sábado',
              status: 'Nueva',
              tone: 'neutral',
            },
          ]
        : [],
      emptyTitle: 'Aún no hay oportunidades asignadas',
      emptyText:
        'Cuando el módulo de solicitudes del backend esté disponible, aquí aparecerán únicamente pedidos compatibles con tu perfil.',
>>>>>>> origin/main
    };
  }

  private adminView(): DashboardView {
    const demo = this.isPreview;
    const summary = this.adminSummary();
    const isLoading = this.adminSummaryLoading();
    const loadingValue = isLoading ? '...' : '0';
    const hasError = Boolean(this.adminSummaryError());
    const pendingStores = summary?.stores.pending ?? 0;
    const pendingBalance = summary?.orders.pendingBalance ?? 0;
    const primaryAction =
      pendingStores > 0
        ? { label: 'Revisar tiendas', route: '/admin/tiendas' }
        : pendingBalance > 0
          ? { label: 'Supervisar pedidos', route: '/admin/pedidos' }
          : { label: 'Revisar operacion', route: '/admin/pedidos' };

    return {
      eyebrow: 'Panel administrador',
      title: 'Una vista ejecutiva para cuidar la operacion y la confianza de REGALIA.',
      text: 'Supervisa pedidos, tiendas, vendedores, usuarios y catalogos desde endpoints administrativos reales.',
      primaryLabel: demo ? 'Revisar tiendas' : primaryAction.label,
      primaryRoute: demo ? '/admin/tiendas' : primaryAction.route,
      metrics: [
        {
<<<<<<< HEAD
          label: 'Tiendas pendientes',
          value: demo ? '5' : String(summary?.stores.pending ?? loadingValue),
          hint: demo
            ? 'Esperan revision administrativa'
            : `${summary?.stores.approved ?? 0} aprobadas, ${summary?.stores.observed ?? 0} observadas`,
        },
        {
          label: 'Pedidos con saldo',
          value: demo ? '3' : String(summary?.orders.pendingBalance ?? loadingValue),
          hint: demo
            ? 'Requieren seguimiento'
            : `${summary?.orders.paid ?? 0} pagados - ${this.formatCurrency(summary?.orders.totalPaid ?? 0)} cobrado`,
        },
        {
          label: 'Vendedores activos',
          value: demo ? '24' : String(summary?.sellers.active ?? loadingValue),
          hint: demo
            ? 'Perfiles comerciales activos'
            : `${summary?.sellers.verified ?? 0} verificados, ${summary?.sellers.withStores ?? 0} con tiendas`,
        },
        {
          label: 'Usuarios gestionables',
          value: demo ? '128' : String(summary?.users.total ?? loadingValue),
          hint: demo
            ? '+12 este mes'
            : `${summary?.users.active ?? 0} activos, ${summary?.users.inactive ?? 0} inactivos`,
        },
      ],
      actions: [
        { label: 'Revisar tiendas', hint: 'Aprobar, observar o rechazar visibilidad', route: '/admin/tiendas', icon: 'T' },
        { label: 'Supervisar pedidos', hint: 'Reservas, estados y comisiones', route: '/admin/pedidos', icon: 'P' },
        { label: 'Gestionar vendedores', hint: 'Perfiles comerciales y tiendas asociadas', route: '/admin/vendedores', icon: 'V' },
        { label: 'Gestionar usuarios', hint: 'Cuentas no administrativas', route: '/admin/usuarios', icon: 'U' },
        { label: 'Administrar catalogos', hint: 'Rubros y mantenedores del sistema', route: '/admin/catalogos', icon: 'C' },
=======
          label: 'Usuarios activos',
          value: demo ? '128' : '0',
          hint: demo ? '+12 este mes' : 'Pendiente de endpoint estadístico',
        },
        {
          label: 'Proveedores verificados',
          value: demo ? '24' : '0',
          hint: demo ? '5 solicitudes en revisión' : 'Pendiente del módulo de verificación',
        },
        {
          label: 'Pedidos abiertos',
          value: demo ? '18' : '0',
          hint: demo ? '3 requieren seguimiento' : 'Sin datos operativos conectados',
        },
        {
          label: 'Comisión estimada',
          value: demo ? 'S/ 1,840' : 'S/ 0',
          hint: demo ? 'Periodo actual' : 'Pendiente del módulo de pagos',
        },
      ],
      actions: [
        {
          label: 'Supervisar operación',
          hint: 'Pedidos, reservas y comisiones',
          route: '/admin/operacion',
          icon: '◈',
        },
        {
          label: 'Gestionar usuarios',
          hint: 'Cuentas, estados y permisos',
          route: '/admin/usuarios',
          icon: '◎',
        },
        {
          label: 'Validar proveedores',
          hint: 'Revisión, observaciones y aprobación',
          route: '/admin/solicitudes-proveedor',
          icon: '✧',
        },
        {
          label: 'Revisar calendario',
          hint: 'Demanda y fechas críticas',
          route: '/admin/calendario',
          icon: '◫',
        },
>>>>>>> origin/main
      ],
      activityTitle: 'Alertas que requieren atencion',
      activityDescription: demo
        ? 'Priorizadas por impacto en confianza, entrega y seguridad.'
        : 'Generadas desde tiendas, pedidos, vendedores, usuarios y catalogos reales.',
      activities: demo
        ? [
<<<<<<< HEAD
            { title: '5 tiendas esperan revision', meta: 'Cambios de estado disponibles desde el modulo Tiendas', status: 'Revisar', tone: 'warning' },
            { title: '3 pedidos proximos a vencer', meta: 'Entrega dentro de las siguientes 24 horas', status: 'Seguimiento', tone: 'warning' },
            { title: 'Disponibilidad de la plataforma', meta: 'Servicios principales operativos', status: 'Estable', tone: 'success' },
          ]
        : this.mapAdminAlerts(summary?.alerts ?? []),
      emptyTitle: hasError
        ? 'No se pudo cargar el resumen administrativo'
        : isLoading
          ? 'Cargando resumen administrativo'
          : 'Operacion sin alertas criticas',
      emptyText: hasError
        ? this.adminSummaryError()
        : isLoading
          ? 'Consultando tiendas, pedidos, vendedores, usuarios y catalogos.'
          : 'Los modulos administrativos conectados no reportan pendientes principales en este momento.',
=======
            {
              title: '5 proveedores esperan verificación',
              meta: 'Documentación completa para revisión',
              status: 'Revisar',
              tone: 'warning',
            },
            {
              title: '3 pedidos próximos a vencer',
              meta: 'Entrega dentro de las siguientes 24 horas',
              status: 'Seguimiento',
              tone: 'warning',
            },
            {
              title: 'Disponibilidad de la plataforma',
              meta: 'Servicios principales operativos',
              status: 'Estable',
              tone: 'success',
            },
          ]
        : [],
      emptyTitle: 'Los módulos operativos aún no están conectados',
      emptyText:
        'La interfaz está preparada. Los indicadores permanecerán en cero hasta que existan endpoints reales en el backend.',
>>>>>>> origin/main
    };
  }

  private loadAdminSummary(): void {
    if (this.adminSummaryLoading()) return;

    this.adminSummaryLoading.set(true);
    this.adminSummaryError.set('');

    this.adminSummaryApi
      .getSummary()
      .pipe(
        finalize(() => this.adminSummaryLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (summary) => this.adminSummary.set(summary),
        error: () => {
          this.adminSummary.set(null);
          this.adminSummaryError.set('Verifica tu sesion administrativa o la disponibilidad del backend.');
        },
      });
  }

  private mapAdminAlerts(alerts: AdminSummaryAlert[]): DashboardActivity[] {
    return alerts.map((alert) => ({
      title: alert.title,
      meta: alert.meta,
      status: alert.status,
      tone: alert.tone,
      route: alert.route,
    }));
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-PE', {
      currency: 'PEN',
      style: 'currency',
    }).format(value);
  }
}
