import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthSessionService } from '../../services/auth/auth-session.service';
import { CartService } from '../../services/cart/cart.service';

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
  private readonly cartService = inject(CartService);

  readonly isMenuOpen = signal(false);
  readonly currentUser = this.authSession.currentUser;
  readonly isLoggedIn = this.authSession.isLoggedIn;
  readonly workspaceRoute = computed(() => this.authSession.homeForCurrentUser());
  readonly cartTotalItems = this.cartService.totalItems;

  readonly navItems: NavItem[] = [
    { label: 'Inicio', route: '/' },
    { label: 'Pedir con IA', route: '/pedir-con-ia' },
    { label: 'Catálogo', route: '/catalogo' },
    { label: 'Vendedores', route: '/vendedores' },
    { label: 'Cómo funciona', route: '/modelo' },
  ];

  toggleMenu(): void {
    this.isMenuOpen.update((isOpen) => !isOpen);
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
  }

  logout(): void {
    this.authSession.logout();
    this.closeMenu();
    void this.router.navigate(['/']);
  }
}
