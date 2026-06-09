import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthSessionService } from '../../services/auth/auth-session.service';

interface NavItem {
  label: string;
  route: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class NavbarComponent {
  private readonly authSession = inject(AuthSessionService);
  private readonly router = inject(Router);

  readonly isMenuOpen = signal(false);
  readonly currentUser = this.authSession.currentUser;
  readonly isLoggedIn = this.authSession.isLoggedIn;
  // Links adicionales que aparecen solo cuando existe sesion y dependen del rol activo.
  readonly roleNavItems = computed(() => this.authSession.navForCurrentRole());

  readonly navItems: NavItem[] = [
    { label: 'Inicio', route: '/' },
    { label: 'Pedir con IA', route: '/pedir-con-ia' },
    { label: 'Catálogo', route: '/catalogo' },
    { label: 'Proveedores', route: '/proveedores' },
    { label: 'Panel', route: '/panel' },
    { label: 'Modelo', route: '/modelo' },
  ];

  toggleMenu(): void {
    this.isMenuOpen.update((isOpen) => !isOpen);
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
  }

  logout(): void {
    // Cierra la sesion mock del frontend y devuelve al usuario a la portada publica.
    this.authSession.logout();
    this.closeMenu();
    void this.router.navigate(['/']);
  }
}
