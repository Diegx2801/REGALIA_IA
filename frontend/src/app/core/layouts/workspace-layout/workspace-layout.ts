import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  PREVIEW_IDENTITIES,
  PREVIEW_ROUTES,
  WorkspaceIdentity,
} from '../../config/workspace-preview.config';
import { AuthSessionService } from '../../services/auth/auth-session.service';
import { UserRole } from '../../services/auth/auth-session.model';

interface WorkspaceNavItem {
  label: string;
  description: string;
  route: string;
  icon: string;
  exact?: boolean;
}

interface WorkspaceConfig {
  eyebrow: string;
  title: string;
  description: string;
  navItems: WorkspaceNavItem[];
}

const WORKSPACE_CONFIG: Record<UserRole, WorkspaceConfig> = {
  Cliente: {
    eyebrow: 'Espacio cliente',
    title: 'Mis regalos',
    description: 'Reservas, cuenta y acceso comercial sin mezclarlo con el marketplace público.',
    navItems: [
      { label: 'Mis reservas', description: 'Seguimiento y fechas', route: '/cliente/reservas', icon: '◫', exact: true },
      { label: 'Mi perfil', description: 'Datos y contacto', route: '/cliente/perfil', icon: '◎' },
      { label: 'Vender en REGALIA', description: 'Solicitud para vender', route: '/cliente/solicitud-vendedor', icon: '✧' },
    ],
  },
  Vendedor: {
    eyebrow: 'Espacio vendedor',
    title: 'Mi negocio',
    description: 'Gestiona pedidos, tienda y presencia comercial.',
    navItems: [
      { label: 'Resumen', description: 'Actividad principal', route: '/vendedor/resumen', icon: '⌂', exact: true },
      { label: 'Pedidos', description: 'Solicitudes y cotizaciones', route: '/vendedor/pedidos', icon: '◇' },
      { label: 'Perfil del negocio', description: 'Catálogo y disponibilidad', route: '/vendedor/perfil', icon: '▦' },
      { label: 'Mi cuenta', description: 'Datos personales', route: '/vendedor/cuenta', icon: '◎' },
    ],
  },
  Administrador: {
    eyebrow: 'Administración',
    title: 'Centro de control',
    description: 'Supervisa usuarios, operación y confianza de la plataforma.',
    navItems: [
      { label: 'Resumen', description: 'Prioridades generales', route: '/admin/resumen', icon: 'R', exact: true },
      { label: 'Pedidos', description: 'Reservas y comisiones', route: '/admin/pedidos', icon: 'P' },
      { label: 'Tiendas', description: 'Revisión y visibilidad', route: '/admin/tiendas', icon: 'T' },
      { label: 'Vendedores', description: 'Perfiles comerciales', route: '/admin/vendedores', icon: 'V' },
      { label: 'Usuarios', description: 'Cuentas gestionables', route: '/admin/usuarios', icon: 'U' },
      { label: 'Catálogos', description: 'Mantenedores del sistema', route: '/admin/catalogos', icon: 'C' },
    ],
  },
};

@Component({
  selector: 'app-workspace-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './workspace-layout.html',
  styleUrl: './workspace-layout.css',
})
export class WorkspaceLayoutComponent {
  private readonly authSession = inject(AuthSessionService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly previewRole = (this.route.snapshot.data['previewRole'] ?? null) as UserRole | null;

  readonly isMenuOpen = signal(false);
  readonly isPreview = this.previewRole !== null;
  readonly activeRole = computed<UserRole>(() => this.previewRole ?? this.authSession.role() ?? 'Cliente');
  readonly config = computed(() => WORKSPACE_CONFIG[this.activeRole()]);
  readonly previewHome = computed(() => PREVIEW_ROUTES[this.activeRole()]);
  readonly user = computed<WorkspaceIdentity | null>(() => {
    if (this.isPreview) return PREVIEW_IDENTITIES[this.activeRole()];
    return this.authSession.currentUser();
  });
  readonly initials = computed(() => {
    const name = this.user()?.fullName.trim();
    if (!name) return 'RG';

    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  });

  routeFor(item: WorkspaceNavItem): string {
    return this.isPreview ? this.previewHome() : item.route;
  }

  toggleMenu(): void {
    this.isMenuOpen.update((isOpen) => !isOpen);
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
  }

  exitWorkspace(): void {
    if (this.isPreview) {
      void this.router.navigate(['/vista-previa']);
      return;
    }

    this.authSession.logout();
    this.closeMenu();
    void this.router.navigate(['/']);
  }
}
