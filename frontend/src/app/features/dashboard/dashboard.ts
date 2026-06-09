import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthSessionService } from '../../core/services/auth/auth-session.service';
import { RegaliaService } from '../../core/services/data-access/regalia/regalia.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent {
  private readonly authSession = inject(AuthSessionService);
  private readonly regaliaService = inject(RegaliaService);

  readonly user = this.authSession.currentUser;
  readonly role = this.authSession.role;
  readonly orders = this.regaliaService.getOrders();
  readonly providers = this.regaliaService.getProviders();

  // Copys y acciones del dashboard cambian segun rol para evitar pantallas duplicadas.
  readonly roleSummary = computed(() => {
    const role = this.role();

    if (role === 'Proveedor') {
      return {
        eyebrow: 'Panel proveedor',
        title: 'Gestiona pedidos recibidos, disponibilidad y catalogo propio.',
        text: 'Prioriza entregas por fecha, revisa solicitudes compatibles y mantén tu perfil listo para nuevas reservas.',
      };
    }

    if (role === 'Administrador') {
      return {
        eyebrow: 'Panel administrador',
        title: 'Supervisa usuarios, reservas y operacion de REGALIA.',
        text: 'Monitorea pedidos activos, comisiones, proveedores y estados desde una vista ejecutiva.',
      };
    }

    return {
      eyebrow: 'Panel cliente',
      title: 'Continua tus solicitudes y reservas personalizadas.',
      text: 'Revisa pedidos, guarda proveedores favoritos y crea nuevas solicitudes con IA o de forma manual.',
    };
  });

  readonly quickActions = computed(() => {
    const role = this.role();

    if (role === 'Proveedor') {
      return [
        { label: 'Ver calendario', route: '/mis-reservas', hint: 'Pedidos recibidos por fecha' },
        { label: 'Editar perfil', route: '/perfil-proveedor', hint: 'Catalogo, estilos y disponibilidad' },
        { label: 'Panel operativo', route: '/panel', hint: 'Estados y comisiones' },
      ];
    }

    if (role === 'Administrador') {
      return [
        { label: 'Panel operativo', route: '/panel', hint: 'Reservas y comisiones' },
        { label: 'Usuarios', route: '/admin/usuarios', hint: 'Clientes, proveedores y roles' },
        { label: 'Calendario', route: '/mis-reservas', hint: 'Pedidos por fecha' },
      ];
    }

    return [
      { label: 'Crear solicitud', route: '/pedir-con-ia', hint: 'Recomendacion con IA' },
      { label: 'Mis reservas', route: '/mis-reservas', hint: 'Seguimiento por fecha' },
      { label: 'Explorar proveedores', route: '/catalogo', hint: 'Favoritos y comparacion' },
    ];
  });
}
