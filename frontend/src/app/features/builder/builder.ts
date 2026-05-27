import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RegaliaService } from '../../core/services/data-access/regalia/regalia.service';
import { MatchRecommendation, RegaliaRequest } from '../../shared/models/regalia.model';

@Component({
  selector: 'app-builder',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './builder.html',
  styleUrl: './builder.css',
})
export class BuilderComponent {
  private readonly regaliaService = inject(RegaliaService);

  readonly occasions = this.regaliaService.getOccasions();
  readonly recommendations = signal<MatchRecommendation[]>([]);
  readonly selectedRecommendation = signal<MatchRecommendation | null>(null);

  readonly requestForm = new FormGroup({
    need: new FormControl('Necesito una torta elegante para graduación, presupuesto S/120, entrega sábado.', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(12)],
    }),
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

  readonly interpretedSummary = computed(() => this.selectedRecommendation()?.interpretedNeed ?? null);

  constructor() {
    this.generateMatches();
  }

  /**
   * Ejecuta el flujo simulado de emparejamiento de REGALIA y mantiene el primer
   * proveedor como opción recomendada para la reserva.
   */
  generateMatches(): void {
    if (this.requestForm.invalid) {
      this.requestForm.markAllAsTouched();
      return;
    }

    const matches = this.regaliaService.matchRequest(this.requestForm.getRawValue());
    this.recommendations.set(matches);
    this.selectedRecommendation.set(matches[0] ?? null);
  }

  selectRecommendation(recommendation: MatchRecommendation): void {
    this.selectedRecommendation.set(recommendation);
  }

  trackRecommendation(_: number, recommendation: MatchRecommendation): number {
    return recommendation.provider.id;
  }

  trackText(_: number, value: string): string {
    return value;
  }
}
