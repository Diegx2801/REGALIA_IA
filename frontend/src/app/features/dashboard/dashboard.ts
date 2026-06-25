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
    if (role === 'Proveedor') return this.providerView();
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
      text: 'Explora proveedores locales, publica una necesidad y compara propuestas con total claridad antes de reservar.',
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
          hint: demo ? 'Listas para comparar' : 'Aparecerán cuando un proveedor responda',
        },
        {
          label: 'Reservas confirmadas',
          value: demo ? '1' : '0',
          hint: demo ? 'Entrega programada esta semana' : 'Tus reservas se mostrarán aquí',
        },
        {
          label: 'Favoritos',
          value: demo ? '3' : '0',
          hint: demo ? 'Proveedores guardados' : 'Guarda opciones para compararlas luego',
        },
      ],
      actions: [
        { label: 'Explorar regalos', hint: 'Catálogo y proveedores verificados', route: '/cliente/explorar', icon: '◇' },
        { label: 'Pedir con IA', hint: 'Describe lo que necesitas en tus palabras', route: '/cliente/solicitud', icon: '✦' },
        { label: 'Ver mis reservas', hint: 'Fechas, estados y seguimiento', route: '/cliente/reservas', icon: '◫' },
        { label: 'Vender en REGALIA', hint: 'Postula tu negocio y crea tu perfil comercial', route: '/cliente/solicitud-proveedor', icon: '✧' },
      ],
      activityTitle: 'Actividad reciente',
      activityDescription: 'Solo se muestran acciones vinculadas a tu cuenta.',
      activities: demo
        ? [
            {
              title: 'Regalo de graduación elegante',
              meta: '2 proveedores enviaron una propuesta',
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
      emptyText: 'Empieza creando una solicitud o guardando un proveedor. No mostraremos actividad ficticia en tu cuenta.',
    };
  }

  private providerView(): DashboardView {
    const demo = this.isPreview;
    return {
      eyebrow: 'Panel proveedor',
      title: `Buenos días, ${this.firstName()}. Convierte nuevas solicitudes en experiencias memorables.`,
      text: 'Prioriza oportunidades compatibles, organiza entregas y mantén la reputación de tu negocio en un solo lugar.',
      primaryLabel: 'Revisar solicitudes',
      primaryRoute: '/proveedor/pedidos',
      metrics: [
        { label: 'Solicitudes nuevas', value: demo ? '4' : '0', hint: demo ? '2 con alta compatibilidad' : 'Sin solicitudes nuevas' },
        { label: 'Pedidos en proceso', value: demo ? '6' : '0', hint: demo ? '3 entregas esta semana' : 'Sin pedidos activos' },
        { label: 'Ventas potenciales', value: demo ? 'S/ 1,240' : 'S/ 0', hint: demo ? 'Cotizaciones abiertas' : 'Aún no hay cotizaciones' },
        { label: 'Reputación', value: demo ? '4.9' : '—', hint: demo ? '96 reseñas verificadas' : 'Se calculará con reseñas reales' },
      ],
      actions: [
        { label: 'Gestionar pedidos', hint: 'Cotiza, acepta y actualiza estados', route: '/proveedor/pedidos', icon: '◇' },
        { label: 'Organizar calendario', hint: 'Entregas, cupos y disponibilidad', route: '/proveedor/calendario', icon: '◫' },
        { label: 'Mejorar mi perfil', hint: 'Catálogo, portafolio y zonas', route: '/proveedor/perfil', icon: '▦' },
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
      text: 'Supervisa crecimiento, proveedores, reservas y alertas sin perder de vista la experiencia de clientes y emprendedores.',
      primaryLabel: 'Abrir operación',
      primaryRoute: '/admin/operacion',
      metrics: [
        { label: 'Usuarios activos', value: demo ? '128' : '0', hint: demo ? '+12 este mes' : 'Pendiente de endpoint estadístico' },
        { label: 'Proveedores verificados', value: demo ? '24' : '0', hint: demo ? '5 solicitudes en revisión' : 'Pendiente del módulo de verificación' },
        { label: 'Pedidos abiertos', value: demo ? '18' : '0', hint: demo ? '3 requieren seguimiento' : 'Sin datos operativos conectados' },
        { label: 'Comisión estimada', value: demo ? 'S/ 1,840' : 'S/ 0', hint: demo ? 'Periodo actual' : 'Pendiente del módulo de pagos' },
      ],
      actions: [
        { label: 'Supervisar operación', hint: 'Pedidos, reservas y comisiones', route: '/admin/operacion', icon: '◇' },
        { label: 'Gestionar usuarios', hint: 'Cuentas, estados y permisos', route: '/admin/usuarios', icon: '◎' },
        { label: 'Validar proveedores', hint: 'Revisión, observaciones y aprobación', route: '/admin/solicitudes-proveedor', icon: '✧' },
        { label: 'Revisar calendario', hint: 'Demanda y fechas críticas', route: '/admin/calendario', icon: '◫' },
      ],
      activityTitle: 'Alertas que requieren atención',
      activityDescription: 'Priorizadas por impacto en confianza, entrega y seguridad.',
      activities: demo
        ? [
            { title: '5 proveedores esperan verificación', meta: 'Documentación completa para revisión', status: 'Revisar', tone: 'warning' },
            { title: '3 pedidos próximos a vencer', meta: 'Entrega dentro de las siguientes 24 horas', status: 'Seguimiento', tone: 'warning' },
            { title: 'Disponibilidad de la plataforma', meta: 'Servicios principales operativos', status: 'Estable', tone: 'success' },
          ]
        : [],
      emptyTitle: 'Los módulos operativos aún no están conectados',
      emptyText: 'La interfaz está preparada. Los indicadores permanecerán en cero hasta que existan endpoints reales en el backend.',
    };
  }
}
