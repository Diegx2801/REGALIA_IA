import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthSessionService } from '../../../../core/services/auth/auth-session.service';

// Fecha comercial marcada dentro del calendario de la portada.
interface FestiveDate {
  value: number;
  monthIndex: number;
  day: string;
  month: string;
  title: string;
  hint: string;
  route: string;
  products: string[];
  featured?: boolean;
}

interface CalendarMonth {
  label: string;
  value: number;
}

@Component({
  selector: 'app-festive-calendar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './festive-calendar.html',
  styleUrl: './festive-calendar.css',
})
export class FestiveCalendarComponent {
  private readonly authSession = inject(AuthSessionService);

  readonly festiveDates: FestiveDate[] = [
    {
      value: 14,
      monthIndex: 2,
      day: '14',
      month: 'FEB',
      title: 'San Valentín',
      hint: 'Flores y detalles románticos',
      route: '/catalogo',
      products: ['Ramos premium', 'Box romántico', 'Torta mini'],
      featured: true,
    },
    {
      value: 8,
      monthIndex: 3,
      day: '08',
      month: 'MAR',
      title: 'Día de la Mujer',
      hint: 'Regalos corporativos y flores',
      route: '/catalogo',
      products: ['Flores sobrias', 'Tarjetas personalizadas', 'Packs corporativos'],
    },
    {
      value: 11,
      monthIndex: 5,
      day: '2do',
      month: 'MAY',
      title: 'Día de la Madre',
      hint: 'Boxes, tortas y desayunos',
      route: '/catalogo',
      products: ['Desayuno sorpresa', 'Box mamá', 'Arreglo floral'],
    },
    {
      value: 15,
      monthIndex: 6,
      day: '3er',
      month: 'JUN',
      title: 'Día del Padre',
      hint: 'Sublimados y packs útiles',
      route: '/catalogo',
      products: ['Taza personalizada', 'Pack parrillero', 'Organizador'],
    },
    {
      value: 31,
      monthIndex: 10,
      day: '31',
      month: 'OCT',
      title: 'Halloween',
      hint: 'Dulces y decoración',
      route: '/catalogo',
      products: ['Cupcakes temáticos', 'Decoracion mini', 'Dulces sorpresa'],
    },
    {
      value: 25,
      monthIndex: 12,
      day: '25',
      month: 'DIC',
      title: 'Navidad',
      hint: 'Canastas y regalos familiares',
      route: '/catalogo',
      products: ['Canasta navideña', 'Box familiar', 'Regalo corporativo'],
    },
  ];
  readonly months: CalendarMonth[] = [
    { label: 'Ene', value: 1 },
    { label: 'Feb', value: 2 },
    { label: 'Mar', value: 3 },
    { label: 'Abr', value: 4 },
    { label: 'May', value: 5 },
    { label: 'Jun', value: 6 },
    { label: 'Jul', value: 7 },
    { label: 'Ago', value: 8 },
    { label: 'Sep', value: 9 },
    { label: 'Oct', value: 10 },
    { label: 'Nov', value: 11 },
    { label: 'Dic', value: 12 },
  ];
  readonly weekdays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  // Estado interactivo del calendario: mes y día seleccionados por el usuario.
  readonly selectedMonth = signal(this.festiveDates[0].monthIndex);
  readonly selectedDay = signal(this.festiveDates[0].value);
  readonly days = computed(() =>
    Array.from({ length: this.daysInSelectedMonth() }, (_, index) => index + 1),
  );
  readonly selectedDate = computed(
    () =>
      this.eventFor(this.selectedDay()) ?? {
        value: this.selectedDay(),
        monthIndex: this.selectedMonth(),
        day: String(this.selectedDay()).padStart(2, '0'),
        month: this.monthLabel(this.selectedMonth()).toUpperCase(),
        title: 'Día disponible',
        hint: 'Selecciona una fecha marcada para ver la campaña comercial sugerida.',
        route: '/catalogo',
        products: ['Producto destacado', 'Detalle personalizado', 'Reserva anticipada'],
      },
  );
  // El CTA cambia segun rol: vendedor prepara catalogo; visitante se registra.
  readonly prepareRoute = computed(() =>
    this.authSession.role() === 'Vendedor' ? '/vendedor/perfil' : '/registro',
  );

  selectDay(day: number): void {
    // Permite seleccionar cualquier día de la grilla, tenga o no campaña.
    this.selectedDay.set(day);
  }

  selectDate(date: FestiveDate): void {
    // Al elegir una campaña, sincroniza también el mes activo.
    this.selectedMonth.set(date.monthIndex);
    this.selectedDay.set(date.value);
  }

  eventFor(day: number): FestiveDate | undefined {
    return this.festiveDates.find(
      (date) => date.monthIndex === this.selectedMonth() && date.value === day,
    );
  }

  isSelected(day: number): boolean {
    return this.selectedDay() === day;
  }

  selectMonth(month: CalendarMonth): void {
    // Al cambiar de mes, selecciona la campana del mes si existe; si no, el dia 1.
    this.selectedMonth.set(month.value);
    this.selectedDay.set(
      this.festiveDates.find((date) => date.monthIndex === month.value)?.value ?? 1,
    );
  }

  isSelectedMonth(month: CalendarMonth): boolean {
    return this.selectedMonth() === month.value;
  }

  trackFestiveDate(_: number, date: FestiveDate): string {
    return `${date.month}-${date.day}-${date.title}`;
  }

  trackMonth(_: number, month: CalendarMonth): number {
    return month.value;
  }

  trackWeekday(_: number, weekday: string): string {
    return weekday;
  }

  trackDay(_: number, day: number): number {
    return day;
  }

  private daysInSelectedMonth(): number {
    return new Date(2026, this.selectedMonth(), 0).getDate();
  }

  private monthLabel(monthValue: number): string {
    return this.months.find((month) => month.value === monthValue)?.label ?? 'Mes';
  }
}

