import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { RegaliaService } from '../../core/services/data-access/regalia/regalia.service';
import { MatchRecommendation, RegaliaRequest } from '../../shared/models/regalia.model';

@Component({
  selector: 'app-builder',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './builder.html',
  styleUrl: './builder.css',
})
export class BuilderComponent {
  private readonly regaliaService = inject(RegaliaService);

  @ViewChild('resultsRegion') private readonly resultsRegion?: ElementRef<HTMLElement>;

  readonly occasions = this.regaliaService.getOccasions();
  readonly recommendations = signal<MatchRecommendation[]>([]);
  readonly selectedRecommendation = signal<MatchRecommendation | null>(null);
  readonly confirmedRecommendation = signal<MatchRecommendation | null>(null);
  readonly searchFeedback = signal<string | null>(null);

  readonly requestForm = new FormGroup({
    need: new FormControl(
      'Necesito una torta elegante para graduación, presupuesto S/120, entrega sábado.',
      {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(12)],
      },
    ),
    occasion: new FormControl<RegaliaRequest['occasion']>('Graduación', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    budget: new FormControl(120, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(20), Validators.max(2000)],
    }),
    style: new FormControl('elegante', { nonNullable: true }),
    deliveryDate: new FormControl('Sábado', { nonNullable: true }),
    district: new FormControl('Trujillo', { nonNullable: true }),
    urgent: new FormControl(false, { nonNullable: true }),
  });

  readonly interpretedSummary = computed(
    () => this.selectedRecommendation()?.interpretedNeed ?? null,
  );

  constructor() {
    this.generateMatches(false);
  }

  /**
   * Ejecuta el flujo simulado de emparejamiento de REGALIA y mantiene el primer
   * proveedor como opción recomendada para la reserva.
   */
  generateMatches(shouldFocusResults = true): void {
    if (this.requestForm.invalid) {
      this.requestForm.markAllAsTouched();
      this.searchFeedback.set('Completa los datos requeridos para encontrar proveedores.');
      return;
    }

    const matches = this.regaliaService.matchRequest(this.requestForm.getRawValue());
    this.recommendations.set(matches);
    this.selectedRecommendation.set(matches[0] ?? null);

    if (shouldFocusResults) {
      this.searchFeedback.set(
        matches.length > 0
          ? `${matches.length} proveedores compatibles encontrados.`
          : 'No encontramos proveedores compatibles con esos filtros.',
      );
      window.setTimeout(() => {
        this.resultsRegion?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }

  selectRecommendation(recommendation: MatchRecommendation): void {
    this.selectedRecommendation.set(recommendation);
    this.confirmedRecommendation.set(null);
  }

  /**
   * Cierra el flujo visual del MVP sin persistir datos: deja lista la reserva
   * para que el cliente entienda monto, sena y siguiente paso operativo.
   */
  prepareReservation(): void {
    const selected = this.selectedRecommendation();
    if (!selected) return;

    this.confirmedRecommendation.set(selected);
  }

  clearPreparedReservation(): void {
    this.confirmedRecommendation.set(null);
  }

  trackRecommendation(_: number, recommendation: MatchRecommendation): number {
    return recommendation.provider.id;
  }

  trackText(_: number, value: string): string {
    return value;
  }
}
