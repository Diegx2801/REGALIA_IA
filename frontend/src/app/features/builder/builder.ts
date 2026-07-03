import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { RegaliaRequest } from '../../shared/models/regalia.model';
import {
  FaseBuilder,
  PasoBuilder,
  RecomendacionProductoBuilder,
  SugerenciaRapidaBuilder,
  VistaPreviaSolicitudBuilder,
} from './models/builder.model';
import { BuilderFlowService } from './services/builder-flow.service';

@Component({
  selector: 'app-builder',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './builder.html',
  styleUrl: './builder.css',
})
export class BuilderComponent {
  private readonly flujoBuilder = inject(BuilderFlowService);

  @ViewChild('resultsRegion') private readonly resultsRegion?: ElementRef<HTMLElement>;

  readonly occasions = this.flujoBuilder.obtenerOcasiones();

  readonly currentPhase = signal<FaseBuilder>('need');
  readonly recommendations = signal<RecomendacionProductoBuilder[]>([]);
  readonly selectedRecommendation = signal<RecomendacionProductoBuilder | null>(null);
  readonly confirmedRecommendation = signal<RecomendacionProductoBuilder | null>(null);
  readonly searchFeedback = signal<string | null>(null);

  readonly steps: PasoBuilder[] = [
    {
      phase: 'need',
      label: 'Necesidad',
      description: 'Cuéntanos qué buscas',
    },
    {
      phase: 'interpretation',
      label: 'Interpretación IA',
      description: 'Entendemos tu solicitud',
    },
    {
      phase: 'recommendations',
      label: 'Recomendaciones',
      description: 'Productos ideales para ti',
    },
    {
      phase: 'reservation',
      label: 'Reserva',
      description: 'Confirmas y coordinamos',
    },
  ];

  readonly quickSuggestions: SugerenciaRapidaBuilder[] = [
    {
      label: 'Cumpleaños',
      imageUrl: '/images/cumpleanios1.PNG',
      occasion: 'Cumpleaños',
      style: 'alegre',
      need: 'Busco un regalo especial para cumpleaños, personalizado, bonito y dentro de mi presupuesto.',
    },
    {
      label: 'Aniversario',
      imageUrl: '/images/aniversario.PNG',
      occasion: 'Aniversario',
      style: 'romántico',
      need: 'Quiero un regalo romántico para aniversario, elegante y con algún detalle personalizado.',
    },
    {
      label: 'Graduación',
      imageUrl: '/images/graduacion.PNG',
      occasion: 'Graduación',
      style: 'elegante',
      need: 'Necesito una torta elegante para graduación, presupuesto S/120, entrega sábado.',
    },
    {
      label: 'Flores',
      imageUrl: '/images/flores.PNG',
      occasion: 'Aniversario',
      style: 'romántico',
      need: 'Busco flores bonitas para una sorpresa, con presentación elegante y entrega coordinada.',
    },
    {
      label: 'Box personalizado',
      imageUrl: '/images/boxpersonalizado.PNG',
      occasion: 'Cumpleaños',
      style: 'personalizado',
      need: 'Quiero un box personalizado con detalles dulces, tarjeta y presentación premium.',
    },
    {
      label: 'Torta',
      imageUrl: '/images/torta2.PNG',
      occasion: 'Cumpleaños',
      style: 'elegante',
      need: 'Necesito una torta personalizada, bonita y con entrega para una celebración especial.',
    },
  ];

  readonly requestForm = new FormGroup({
    need: new FormControl(
      'Necesito una torta elegante para graduación, presupuesto S/120, entrega sábado.',
      {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(12), Validators.maxLength(800)],
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
    style: new FormControl('elegante', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    deliveryDate: new FormControl('Sábado', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    district: new FormControl('Trujillo', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    urgent: new FormControl(false, { nonNullable: true }),
  });

  readonly interpretedSummary = computed(
    () => this.selectedRecommendation()?.interpretacion ?? null,
  );

  readonly needLength = computed(() => this.requestForm.controls.need.value.length);

  readonly requestPreview = computed<VistaPreviaSolicitudBuilder>(() => {
    const formValue = this.requestForm.getRawValue();

    return {
      description: formValue.need.trim(),
      occasion: formValue.occasion,
      budget: formValue.budget,
      style: formValue.style.trim(),
      deliveryDate: formValue.deliveryDate.trim(),
      district: formValue.district.trim(),
      urgent: formValue.urgent,
    };
  });

  readonly selectedProviderFacts = computed(() => {
    const selected = this.selectedRecommendation();

    if (!selected) {
      return [];
    }

    const proveedor = selected.proveedor;

    return [
      selected.producto.deliveryTime,
      selected.producto.stockStatus,
      proveedor
        ? `* ${proveedor.rating} · ${proveedor.reviews} reseñas`
        : `* ${selected.producto.rating} · ${selected.producto.reviews} reseñas`,
    ];
  });

  applySuggestion(suggestion: SugerenciaRapidaBuilder): void {
    this.requestForm.patchValue({
      need: suggestion.need,
      occasion: suggestion.occasion,
      style: suggestion.style,
    });

    this.searchFeedback.set(null);
    this.recommendations.set([]);
    this.selectedRecommendation.set(null);
    this.confirmedRecommendation.set(null);
    this.currentPhase.set('need');
  }

  continueToInterpretation(): void {
    if (!this.validateRequestForm()) {
      return;
    }

    this.generateMatches(false);
    this.currentPhase.set('interpretation');
  }

  continueToRecommendations(): void {
    if (this.recommendations().length === 0) {
      this.generateMatches(false);
    }

    this.currentPhase.set('recommendations');
    this.focusResults();
  }

  continueToReservation(): void {
    if (!this.selectedRecommendation()) {
      this.searchFeedback.set('Selecciona una recomendación antes de preparar la reserva.');
      this.currentPhase.set('recommendations');
      return;
    }

    this.currentPhase.set('reservation');
  }

  goToPhase(phase: FaseBuilder): void {
    if (!this.canOpenPhase(phase)) {
      return;
    }

    this.currentPhase.set(phase);
  }

  isStepActive(phase: FaseBuilder): boolean {
    return this.currentPhase() === phase;
  }

  isStepCompleted(phase: FaseBuilder): boolean {
    return this.phaseIndex(phase) < this.phaseIndex(this.currentPhase());
  }

  canOpenPhase(phase: FaseBuilder): boolean {
    if (phase === 'need') {
      return true;
    }

    if (phase === 'interpretation') {
      return this.recommendations().length > 0;
    }

    if (phase === 'recommendations') {
      return this.recommendations().length > 0;
    }

    return this.selectedRecommendation() !== null;
  }

  phaseIndexText(phase: FaseBuilder): number {
    return this.phaseIndex(phase) + 1;
  }

  generateMatches(shouldFocusResults = true): void {
    if (!this.validateRequestForm()) {
      return;
    }

    const result = this.flujoBuilder.obtenerRecomendaciones(this.requestForm.getRawValue());
    const matches = result.recomendaciones;

    this.recommendations.set(matches);
    this.selectedRecommendation.set(matches[0] ?? null);
    this.confirmedRecommendation.set(null);
    this.searchFeedback.set(result.mensaje);

    if (shouldFocusResults) {
      this.focusResults();
    }
  }

  selectRecommendation(recommendation: RecomendacionProductoBuilder): void {
    this.selectedRecommendation.set(recommendation);
    this.confirmedRecommendation.set(null);
  }

  prepareReservation(): void {
    const selected = this.selectedRecommendation();

    if (!selected) {
      return;
    }

    this.confirmedRecommendation.set(selected);
    this.currentPhase.set('reservation');
  }

  clearPreparedReservation(): void {
    this.confirmedRecommendation.set(null);
    this.currentPhase.set('recommendations');
  }

  resetFlow(): void {
    this.currentPhase.set('need');
    this.recommendations.set([]);
    this.selectedRecommendation.set(null);
    this.confirmedRecommendation.set(null);
    this.searchFeedback.set(null);
  }

  trackStep(_: number, step: PasoBuilder): FaseBuilder {
    return step.phase;
  }

  trackRecommendation(_: number, recommendation: RecomendacionProductoBuilder): number {
    return recommendation.producto.id;
  }

  trackText(_: number, value: string): string {
    return value;
  }

  trackSuggestion(_: number, suggestion: SugerenciaRapidaBuilder): string {
    return suggestion.label;
  }

  private validateRequestForm(): boolean {
    if (this.requestForm.valid) {
      this.searchFeedback.set(null);
      return true;
    }

    this.requestForm.markAllAsTouched();
    this.searchFeedback.set('Completa los datos requeridos para continuar.');
    return false;
  }

  private focusResults(): void {
    window.setTimeout(() => {
      this.resultsRegion?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  private phaseIndex(phase: FaseBuilder): number {
    return this.steps.findIndex((step) => step.phase === phase);
  }
}
