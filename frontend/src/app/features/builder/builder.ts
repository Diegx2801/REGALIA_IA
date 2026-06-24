import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { RegaliaService } from '../../core/services/data-access/regalia/regalia.service';
import { MatchRecommendation, RegaliaRequest } from '../../shared/models/regalia.model';

type BuilderPhase = 'need' | 'interpretation' | 'recommendations' | 'reservation';

interface BuilderStep {
  phase: BuilderPhase;
  label: string;
  description: string;
}

interface QuickSuggestion {
  label: string;
  icon: string;
  need: string;
  occasion: RegaliaRequest['occasion'];
  style: string;
}

interface RequestPreview {
  description: string;
  occasion: string;
  budget: number;
  style: string;
  deliveryDate: string;
  district: string;
  urgent: boolean;
}

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

  readonly currentPhase = signal<BuilderPhase>('need');
  readonly recommendations = signal<MatchRecommendation[]>([]);
  readonly selectedRecommendation = signal<MatchRecommendation | null>(null);
  readonly confirmedRecommendation = signal<MatchRecommendation | null>(null);
  readonly searchFeedback = signal<string | null>(null);

  readonly steps: BuilderStep[] = [
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
      description: 'Proveedores ideales para ti',
    },
    {
      phase: 'reservation',
      label: 'Reserva',
      description: 'Confirmas y coordinamos',
    },
  ];

  readonly quickSuggestions: QuickSuggestion[] = [
    {
      label: 'Cumpleaños',
      icon: '🎂',
      occasion: 'Cumpleaños',
      style: 'alegre',
      need: 'Busco un regalo especial para cumpleaños, personalizado, bonito y dentro de mi presupuesto.',
    },
    {
      label: 'Aniversario',
      icon: '💗',
      occasion: 'Aniversario',
      style: 'romántico',
      need: 'Quiero un regalo romántico para aniversario, elegante y con algún detalle personalizado.',
    },
    {
      label: 'Graduación',
      icon: '🎓',
      occasion: 'Graduación',
      style: 'elegante',
      need: 'Necesito una torta elegante para graduación, presupuesto S/120, entrega sábado.',
    },
    {
      label: 'Flores',
      icon: '🌸',
      occasion: 'Aniversario',
      style: 'romántico',
      need: 'Busco flores bonitas para una sorpresa, con presentación elegante y entrega coordinada.',
    },
    {
      label: 'Box personalizado',
      icon: '🎁',
      occasion: 'Cumpleaños',
      style: 'personalizado',
      need: 'Quiero un box personalizado con detalles dulces, tarjeta y presentación premium.',
    },
    {
      label: 'Torta',
      icon: '🍰',
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
    () => this.selectedRecommendation()?.interpretedNeed ?? null,
  );

  readonly needLength = computed(() => this.requestForm.controls.need.value.length);

  readonly requestPreview = computed<RequestPreview>(() => {
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

    return [
      selected.provider.district,
      selected.provider.deliveryTime,
      `★ ${selected.provider.rating} · ${selected.provider.reviews} reseñas`,
    ];
  });

  applySuggestion(suggestion: QuickSuggestion): void {
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

  goToPhase(phase: BuilderPhase): void {
    if (!this.canOpenPhase(phase)) {
      return;
    }

    this.currentPhase.set(phase);
  }

  isStepActive(phase: BuilderPhase): boolean {
    return this.currentPhase() === phase;
  }

  isStepCompleted(phase: BuilderPhase): boolean {
    return this.phaseIndex(phase) < this.phaseIndex(this.currentPhase());
  }

  canOpenPhase(phase: BuilderPhase): boolean {
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

  phaseIndexText(phase: BuilderPhase): number {
    return this.phaseIndex(phase) + 1;
  }

  generateMatches(shouldFocusResults = true): void {
    if (!this.validateRequestForm()) {
      return;
    }

    const matches = this.regaliaService.matchRequest(this.requestForm.getRawValue());

    this.recommendations.set(matches);
    this.selectedRecommendation.set(matches[0] ?? null);
    this.confirmedRecommendation.set(null);

    this.searchFeedback.set(
      matches.length > 0
        ? `${matches.length} proveedores compatibles encontrados.`
        : 'No encontramos proveedores compatibles con esos filtros.',
    );

    if (shouldFocusResults) {
      this.focusResults();
    }
  }

  selectRecommendation(recommendation: MatchRecommendation): void {
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

  trackStep(_: number, step: BuilderStep): BuilderPhase {
    return step.phase;
  }

  trackRecommendation(_: number, recommendation: MatchRecommendation): number {
    return recommendation.provider.id;
  }

  trackText(_: number, value: string): string {
    return value;
  }

  trackSuggestion(_: number, suggestion: QuickSuggestion): string {
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

  private phaseIndex(phase: BuilderPhase): number {
    return this.steps.findIndex((step) => step.phase === phase);
  }
}