/**
 * =========================================================================
 * COMPONENTE DE ESTRUCTURA: PublicLayoutComponent
 * DESCRIPCIÓN: Contenedor estructural para todas las vistas públicas de comunicación comercial.
 * =========================================================================
 */
import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar';
import { FooterComponent } from '../../components/footer/footer';
import { AuthSessionService } from '../../services/auth/auth-session.service';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent],
  templateUrl: './public-layout.html',
  styleUrl: './public-layout.css',
})
export class PublicLayoutComponent {
  private readonly authSession = inject(AuthSessionService);

  constructor() {
    this.authSession.setActiveContext('PUBLIC');
  }
}
