/**
 * =========================================================================
 * COMPONENTE: NavbarComponent
 * DESCRIPCIÓN: Barra de navegación superior standalone para el entorno público.
 * ESTÁNDAR: Angular 17+ Standalone Component.
 * =========================================================================
 */
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class NavbarComponent {}
