import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  PREVIEW_IDENTITIES,
  PREVIEW_ROUTES,
  WorkspaceIdentity,
} from '../../core/config/workspace-preview.config';
import { AuthSessionService } from '../../core/services/auth/auth-session.service';
import { UserRole } from '../../core/services/auth/auth-session.model';

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
export class DashboardComponent {
  private readonly authSession = inject(AuthSessionService);
  private readonly route = inject(ActivatedRoute);
  private readonly previewRole = (this.route.parent?.snapshot.data['previewRole'] ?? null) as UserRole | null;

  readonly isPreview = this.previewRole !== null;
  readonly role = computed<UserRole>(() => this.previewRole ?? this.authSession.role() ?? 'Cliente');
  readonly previewHome = computed(() => PREVIEW_ROUTES[this.role()]);
  readonly user = computed<WorkspaceIdentity | null>(() => {
    if (this.isPreview) return PREVIEW_IDENTITIES[this.role()];
    return this.authSession.currentUser();
  });
  readonly firstName = computed(() => this.user()?.fullName.split(/\s+/)[0] ?? 'Hola');
  readonly todayLabel = new Intl.DateTimeFormat('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  readonly view = computed<DashboardView>(() => {
    const role = this.role();
    if (role === 'Vendedor') return this.sellerView();
    if (role === 'Administrador') return this.adminView();
    return this.clientView();
  });

  actionRoute(route: string): string {
    return this.isPreview ? this.previewHome() : route;
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
          hint: demo ? 'Esperando nuevas cotizaciones' : 'Aún no has publicado solicitudes',
        },
        {
          label: 'Cotizaciones recibidas',
          value: demo ? '2' : '0',
          hint: demo ? 'Listas para comparar' : 'Aparecerán cuando un vendedor responda',
        },
        {
          label: 'Reservas confirmadas',
          value: demo ? '1' : '0',
          hint: demo ? 'Entrega programada esta semana' : 'Tus reservas se mostrarán aquí',
        },
        {
          label: 'Favoritos',
          value: demo ? '3' : '0',
          hint: demo ? 'Vendedores guardados' : 'Guarda opciones para compararlas luego',
        },
      ],
      actions: [
        { label: 'Explorar regalos', hint: 'Catálogo y vendedores verificados', route: '/cliente/explorar', icon: '◇' },
        { label: 'Pedir con IA', hint: 'Describe lo que necesitas en tus palabras', route: '/cliente/solicitud', icon: '✦' },
        { label: 'Ver mis reservas', hint: 'Fechas, estados y seguimiento', route: '/cliente/reservas', icon: '◫' },
        { label: 'Vender en REGALIA', hint: 'Postula tu negocio y crea tu perfil comercial', route: '/cliente/solicitud-vendedor', icon: '✧' },
      ],
      activityTitle: 'Actividad reciente',
      activityDescription: 'Solo se muestran acciones vinculadas a tu cuenta.',
      activities: demo
        ? [
            {
              title: 'Regalo de graduación elegante',
              meta: '2 vendedores enviaron una propuesta',
              status: 'Comparar',
              tone: 'warning',
            },
            {
              title: 'Box de aniversario personalizado',
              meta: 'Entrega programada · sábado 6:00 p. m.',
              status: 'Confirmada',
              tone: 'success',
            },
          ]
        : [],
      emptyTitle: 'Tu espacio está listo',
      emptyText: 'Empieza creando una solicitud o guardando un vendedor. No mostraremos actividad ficticia en tu cuenta.',
    };
  }

  private sellerView(): DashboardView {
    const demo = this.isPreview;
    return {
      eyebrow: 'Panel vendedor',
      title: `Buenos días, ${this.firstName()}. Convierte nuevas solicitudes en experiencias memorables.`,
      text: 'Prioriza oportunidades compatibles, organiza entregas y mantén la reputación de tu negocio en un solo lugar.',
      primaryLabel: 'Revisar solicitudes',
      primaryRoute: '/vendedor/pedidos',
      metrics: [
        { label: 'Solicitudes nuevas', value: demo ? '4' : '0', hint: demo ? '2 con alta compatibilidad' : 'Sin solicitudes nuevas' },
        { label: 'Pedidos en proceso', value: demo ? '6' : '0', hint: demo ? '3 entregas esta semana' : 'Sin pedidos activos' },
        { label: 'Ventas potenciales', value: demo ? 'S/ 1,240' : 'S/ 0', hint: demo ? 'Cotizaciones abiertas' : 'Aún no hay cotizaciones' },
        { label: 'Reputación', value: demo ? '4.9' : '—', hint: demo ? '96 reseñas verificadas' : 'Se calculará con reseñas reales' },
      ],
      actions: [
        { label: 'Gestionar pedidos', hint: 'Cotiza, acepta y actualiza estados', route: '/vendedor/pedidos', icon: '◇' },
        { label: 'Organizar calendario', hint: 'Entregas, cupos y disponibilidad', route: '/vendedor/calendario', icon: '◫' },
        { label: 'Mejorar mi perfil', hint: 'Catálogo, portafolio y zonas', route: '/vendedor/perfil', icon: '▦' },
      ],
      activityTitle: 'Oportunidades prioritarias',
      activityDescription: 'Ordenadas por compatibilidad, urgencia y fecha de entrega.',
      activities: demo
        ? [
            { title: 'Box de cumpleaños · Víctor Larco', meta: 'Presupuesto S/ 120 · entrega mañana', status: '96% compatible', tone: 'success' },
            { title: 'Detalle corporativo · Centro', meta: '20 unidades · cotización abierta', status: 'Cotizar hoy', tone: 'warning' },
            { title: 'Desayuno sorpresa · California', meta: 'Presupuesto S/ 85 · sábado', status: 'Nueva', tone: 'neutral' },
          ]
        : [],
      emptyTitle: 'Aún no hay oportunidades asignadas',
      emptyText: 'Cuando el módulo de solicitudes del backend esté disponible, aquí aparecerán únicamente pedidos compatibles con tu perfil.',
    };
  }

  private adminView(): DashboardView {
    const demo = this.isPreview;
    return {
      eyebrow: 'Panel administrador',
      title: 'Una vista ejecutiva para cuidar la operación y la confianza de REGALIA.',
      text: 'Supervisa pedidos, tiendas, vendedores y usuarios sin mezclar responsabilidades del portal público.',
      primaryLabel: 'Revisar tiendas',
      primaryRoute: '/admin/tiendas',
      metrics: [
        { label: 'Tiendas pendientes', value: demo ? '5' : '0', hint: demo ? 'Esperan revisión administrativa' : 'Pendiente de conectar /api/admin/tiendas' },
        { label: 'Pedidos activos', value: demo ? '18' : '0', hint: demo ? '3 requieren seguimiento' : 'Pendiente de conectar /api/admin/pedidos' },
        { label: 'Vendedores', value: demo ? '24' : '0', hint: demo ? 'Perfiles comerciales activos' : 'Pendiente de conectar /api/admin/vendedores' },
        { label: 'Usuarios gestionables', value: demo ? '128' : '0', hint: demo ? '+12 este mes' : 'Pendiente de conectar /api/admin/usuarios' },
      ],
      actions: [
        { label: 'Revisar tiendas', hint: 'Aprobar, observar o rechazar visibilidad', route: '/admin/tiendas', icon: 'T' },
        { label: 'Supervisar pedidos', hint: 'Reservas, estados y comisiones', route: '/admin/pedidos', icon: 'P' },
        { label: 'Gestionar vendedores', hint: 'Perfiles comerciales y tiendas asociadas', route: '/admin/vendedores', icon: 'V' },
        { label: 'Gestionar usuarios', hint: 'Cuentas no administrativas', route: '/admin/usuarios', icon: 'U' },
        { label: 'Administrar catálogos', hint: 'Rubros y mantenedores del sistema', route: '/admin/catalogos', icon: 'C' },
      ],
      activityTitle: 'Alertas que requieren atención',
      activityDescription: 'Priorizadas por impacto en confianza, entrega y seguridad.',
      activities: demo
        ? [
            { title: '5 tiendas esperan revisión', meta: 'Cambios de estado disponibles desde el módulo Tiendas', status: 'Revisar', tone: 'warning' },
            { title: '3 pedidos próximos a vencer', meta: 'Entrega dentro de las siguientes 24 horas', status: 'Seguimiento', tone: 'warning' },
            { title: 'Disponibilidad de la plataforma', meta: 'Servicios principales operativos', status: 'Estable', tone: 'success' },
          ]
        : [],
      emptyTitle: 'Centro administrativo preparado',
      emptyText: 'El menú ya sigue la separación real de la API. Los indicadores se conectarán por módulo para evitar datos simulados en decisiones operativas.',
    };
  }
}
