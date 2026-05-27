import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

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
  readonly isMenuOpen = signal(false);

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
}
