import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RegaliaService } from '../../core/services/data-access/regalia/regalia.service';
import { RegaliaCategory, RegaliaOccasion, RegaliaSeller } from '../../shared/models/regalia.model';

@Component({
  selector: 'app-manual-builder',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './manual-builder.html',
  styleUrl: './manual-builder.css',
})
export class ManualBuilderComponent {
  private readonly regaliaService = inject(RegaliaService);

  readonly categories: Array<RegaliaCategory | 'Todas'> = ['Todas', ...this.regaliaService.getCategories()];
  readonly occasions = this.regaliaService.getOccasions();
  readonly sellers = signal(this.regaliaService.getSellers());
  readonly selectedSeller = signal<RegaliaSeller>(this.sellers()[0]);
  readonly submitted = signal(false);
  private readonly formVersion = signal(0);

  readonly manualForm = new FormGroup({
    occasion: new FormControl<RegaliaOccasion>('Día de la Madre', { nonNullable: true }),
    category: new FormControl<RegaliaCategory | 'Todas'>('Todas', { nonNullable: true }),
    budget: new FormControl(160, { nonNullable: true }),
    style: new FormControl('elegante y cálido', { nonNullable: true }),
    deliveryDate: new FormControl('Sábado 6:00 p.m.', { nonNullable: true }),
    district: new FormControl('Trujillo', { nonNullable: true }),
    details: new FormControl('Quiero un detalle personalizado con tarjeta y presentación premium.', { nonNullable: true }),
  });

  readonly compatibleSellers = computed(() => {
    this.formVersion();
    const request = this.manualForm.getRawValue();

    return this.regaliaService.findCompatibleSellers(request.category, request.occasion, request.budget);
  });

  readonly reservationBreakdown = computed(() => {
    this.formVersion();
    return this.regaliaService.calculateReservationBreakdown(this.manualForm.controls.budget.value);
  });

  constructor() {
    this.ensureSelectedSellerIsVisible();
  }

  onFormChanged(): void {
    this.formVersion.update((value) => value + 1);
    this.ensureSelectedSellerIsVisible();
    this.submitted.set(false);
  }

  confirmManualRequest(): void {
    this.formVersion.update((value) => value + 1);
    this.ensureSelectedSellerIsVisible();
    this.submitted.set(true);
  }

  selectSeller(seller: RegaliaSeller): void {
    this.selectedSeller.set(seller);
  }

  trackSeller(_: number, seller: RegaliaSeller): number {
    return seller.id;
  }

  trackText(_: number, value: string): string {
    return value;
  }

  private ensureSelectedSellerIsVisible(): void {
    const visibleSellers = this.compatibleSellers();
    const selected = this.selectedSeller();

    if (visibleSellers.length > 0 && !visibleSellers.some((seller) => seller.id === selected.id)) {
      this.selectedSeller.set(visibleSellers[0]);
    }
  }
}
