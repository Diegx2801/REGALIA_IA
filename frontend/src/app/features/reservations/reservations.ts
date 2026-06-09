import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AuthSessionService } from '../../core/services/auth/auth-session.service';
import { RegaliaService } from '../../core/services/data-access/regalia/regalia.service';
import { RegaliaOrder } from '../../shared/models/regalia.model';

// Pedido enriquecido con fecha y hora para la vista calendario del frontend.
interface CalendarOrder extends RegaliaOrder {
  scheduledDate: string;
  scheduledTime: string;
}

@Component({
  selector: 'app-reservations',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reservations.html',
  styleUrl: './reservations.css',
})
export class ReservationsComponent {
  private readonly authSession = inject(AuthSessionService);
  private readonly regaliaService = inject(RegaliaService);
  private readonly calendarVersion = signal(0);

  readonly role = this.authSession.role;
  readonly today = this.formatDate(new Date());
  readonly selectedDate = new FormControl(this.today, { nonNullable: true });

  // Datos mock enriquecidos con agenda para validar el calendario antes de usar API real.
  readonly orders: CalendarOrder[] = this.regaliaService.getOrders().map((order, index) => ({
    ...order,
    scheduledDate: this.offsetDate(index),
    scheduledTime: ['10:00 a.m.', '4:00 p.m.', '7:00 p.m.'][index] ?? '5:00 p.m.',
  }));

  readonly weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = this.offsetDate(index);
    return {
      date,
      label: new Intl.DateTimeFormat('es-PE', { weekday: 'short', day: '2-digit' }).format(new Date(`${date}T12:00:00`)),
    };
  });

  readonly filteredOrders = computed(() => {
    // calendarVersion fuerza recalculo cuando cambia el FormControl manualmente.
    this.calendarVersion();
    return this.orders.filter((order) => order.scheduledDate === this.selectedDate.value);
  });
  readonly selectedDateTotal = computed(() =>
    this.filteredOrders().reduce((sum, order) => sum + order.total, 0),
  );

  readonly pageCopy = computed(() => {
    const role = this.role();

    if (role === 'Proveedor') {
      return {
        eyebrow: 'Calendario proveedor',
        title: 'Pedidos recibidos organizados por fecha.',
        text: 'Selecciona un dia para revisar entregas, estados y senas asociadas a tus pedidos.',
      };
    }

    if (role === 'Administrador') {
      return {
        eyebrow: 'Calendario operativo',
        title: 'Reservas y entregas visibles por fecha.',
        text: 'Controla pedidos activos, proveedores asignados y avance operativo por dia.',
      };
    }

    return {
      eyebrow: 'Mis reservas',
      title: 'Tus pedidos y entregas en calendario.',
      text: 'Consulta por fecha el estado de tus reservas y los proveedores seleccionados.',
    };
  });

  selectDate(date: string): void {
    this.selectedDate.setValue(date);
    this.calendarVersion.update((value) => value + 1);
  }

  onDateChanged(): void {
    this.calendarVersion.update((value) => value + 1);
  }

  trackDay(_: number, day: { date: string }): string {
    return day.date;
  }

  trackOrder(_: number, order: CalendarOrder): number {
    return order.id;
  }

  private offsetDate(offset: number): string {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return this.formatDate(date);
  }

  private formatDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
