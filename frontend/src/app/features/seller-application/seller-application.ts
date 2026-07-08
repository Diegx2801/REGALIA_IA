import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { catchError, finalize, Observable, of, switchMap } from 'rxjs';
import {
  MarketplaceRubroApiDto,
  SellerProfileApiDto,
  SellerStoreApiDto,
  SellerStoreReviewStatus,
  SellerStoreUpdateRequest,
} from '../../core/services/data-access/regalia/models/seller-workspace-api.model';
import { RegaliaSellerWorkspaceApiService } from '../../core/services/data-access/regalia/services/regalia-seller-workspace-api.service';
import {
  SellerApplication,
  SellerApplicationPayload,
  SellerApplicationService,
  SellerApplicationStatus,
} from '../../core/services/seller-application/seller-application.service';
import { AuthSessionService } from '../../core/services/auth/auth-session.service';

interface OnboardingStep {
  number: number;
  label: string;
  shortLabel: string;
  description: string;
}

const CATEGORY_OPTIONS = [
  'Cajas sorpresa',
  'Arreglos florales',
  'Repostería personalizada',
  'Manualidades',
  'Sublimados',
  'Decoración de eventos',
  'Carpintería personalizada',
  'Fotografía y video',
  'Diseño y servicios creativos',
];

const DELIVERY_OPTIONS = ['Recojo en tienda', 'Delivery propio', 'Courier externo', 'Entrega en punto acordado'];

@Component({
  selector: 'app-seller-application',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './seller-application.html',
  styleUrl: './seller-application.css',
})
export class SellerApplicationComponent implements OnInit {
  private readonly authSession = inject(AuthSessionService);
  private readonly applicationService = inject(SellerApplicationService);
  private readonly sellerWorkspaceApi = inject(RegaliaSellerWorkspaceApiService);
  private readonly router = inject(Router);

  private readonly categoryAliases = new Map<string, string>([
    ['Cajas sorpresa', 'BOXES Y CANASTAS'],
    ['Arreglos florales', 'FLORES Y ARREGLOS'],
    ['ReposterÃ­a personalizada', 'REPOSTERIA PERSONALIZADA'],
    ['Manualidades', 'MANUALIDADES'],
    ['Sublimados', 'SUBLIMADOS'],
    ['DecoraciÃ³n de eventos', 'DECORACION DE EVENTOS'],
    ['CarpinterÃ­a personalizada', 'CARPINTERIA PERSONALIZADA'],
    ['FotografÃ­a y video', 'SERVICIOS CREATIVOS'],
    ['DiseÃ±o y servicios creativos', 'SERVICIOS CREATIVOS'],
  ]);

  readonly steps: OnboardingStep[] = [
    { number: 1, label: 'Datos del negocio', shortLabel: 'Negocio', description: 'Cuéntanos quién eres y cómo contactarte.' },
    { number: 2, label: 'Oferta comercial', shortLabel: 'Oferta', description: 'Define qué haces y para quién.' },
    { number: 3, label: 'Operación', shortLabel: 'Operación', description: 'Cobertura, entregas y disponibilidad.' },
    { number: 4, label: 'Confianza', shortLabel: 'Confianza', description: 'Experiencia, portafolio y presencia digital.' },
    { number: 5, label: 'Revisión', shortLabel: 'Enviar', description: 'Confirma la información antes de enviarla.' },
  ];

  readonly categories = CATEGORY_OPTIONS;
  readonly deliveryOptions = DELIVERY_OPTIONS;
  readonly currentStep = signal(1);
  readonly selectedCategories = signal<string[]>([]);
  readonly selectedDeliveryMethods = signal<string[]>([]);
  readonly application = signal<SellerApplication | null>(null);
  readonly sellerProfile = signal<SellerProfileApiDto | null>(null);
  readonly sellerStore = signal<SellerStoreApiDto | null>(null);
  readonly rubros = signal<MarketplaceRubroApiDto[]>([]);
  readonly isEditingReviewChanges = signal(false);
  readonly saveMessage = signal('');
  readonly isSaving = signal(false);
  readonly showValidationSummary = signal(false);

  readonly status = computed<SellerApplicationStatus>(() => {
    const store = this.sellerStore();
    return store ? this.toApplicationStatus(store.estadoRevision) : this.application()?.status ?? 'draft';
  });
  readonly hasReviewState = computed(() => this.status() !== 'draft' && !this.isEditingReviewChanges());
  readonly isLocked = computed(() => ['submitted', 'under_review', 'approved'].includes(this.status()));
  readonly canEdit = computed(() => !this.isLocked() || this.isEditingReviewChanges());
  readonly progress = computed(() => `${Math.max(1, this.currentStep()) * 20}%`);

  readonly form = new FormGroup({
    businessName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3), Validators.maxLength(100)],
    }),
    responsibleName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3), Validators.maxLength(120)],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    whatsapp: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^[0-9+()\s-]{7,20}$/)],
    }),
    ruc: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(/^$|^[0-9]{11}$/)],
    }),
    businessType: new FormControl('Productos personalizados', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(40), Validators.maxLength(500)],
    }),
    priceFrom: new FormControl<number | null>(null, [Validators.min(0)]),
    priceTo: new FormControl<number | null>(null, [Validators.min(0)]),
    customWork: new FormControl(true, { nonNullable: true }),
    district: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    serviceZones: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(5), Validators.maxLength(250)],
    }),
    preparationTime: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    availability: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    experienceYears: new FormControl<number | null>(null, [Validators.min(0), Validators.max(60)]),
    instagram: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(150)] }),
    facebook: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(150)] }),
    portfolioUrl: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(250)] }),
    differentiator: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(20), Validators.maxLength(350)],
    }),
    acceptedTerms: new FormControl(false, { nonNullable: true, validators: [Validators.requiredTrue] }),
    confirmsTruthfulness: new FormControl(false, {
      nonNullable: true,
      validators: [Validators.requiredTrue],
    }),
  });

  readonly applicationSummary = computed(() => {
    const application = this.application();
    const store = this.sellerStore();
    const storeCategories =
      store?.rubros?.map((rubro) => rubro.nombre).filter((name): name is string => Boolean(name)) ?? [];

    return {
      businessName: store?.nombre ?? application?.businessName ?? 'Tienda registrada',
      updatedAt: store?.fechaActualizacion ?? store?.fechaCreacion ?? application?.updatedAt ?? '',
      categories: storeCategories.length > 0 ? storeCategories : application?.categories ?? [],
      responsibleName: application?.responsibleName ?? this.form.controls.responsibleName.value,
      whatsapp: application?.whatsapp ?? this.form.controls.whatsapp.value,
      district: store?.direccionReferencia ?? application?.district ?? this.form.controls.district.value,
      preparationTime: application?.preparationTime ?? this.form.controls.preparationTime.value,
      adminNotes: application?.adminNotes ?? '',
    };
  });

  ngOnInit(): void {
    const user = this.authSession.currentUser();
    if (!user) {
      void this.router.navigate(['/login'], {
        queryParams: { origen: 'vendedor', returnUrl: '/cliente/solicitud-vendedor' },
      });
      return;
    }

    const existing = this.applicationService.getByUser(user.id);
    this.application.set(existing);

    if (existing) {
      this.currentStep.set(existing.currentStep || 1);
      this.selectedCategories.set([...existing.categories]);
      this.selectedDeliveryMethods.set([...existing.deliveryMethods]);
      this.form.patchValue(existing);
    } else {
      this.form.patchValue({
        responsibleName: user.fullName,
        email: user.email,
      });
    }

    this.loadRubros();
    this.loadSellerState();
  }

  toggleCategory(category: string): void {
    if (!this.canEdit()) return;
    this.selectedCategories.update((items) =>
      items.includes(category) ? items.filter((item) => item !== category) : [...items, category],
    );
    this.showValidationSummary.set(false);
  }

  toggleDeliveryMethod(method: string): void {
    if (!this.canEdit()) return;
    this.selectedDeliveryMethods.update((items) =>
      items.includes(method) ? items.filter((item) => item !== method) : [...items, method],
    );
    this.showValidationSummary.set(false);
  }

  isCategorySelected(category: string): boolean {
    return this.selectedCategories().includes(category);
  }

  isDeliverySelected(method: string): boolean {
    return this.selectedDeliveryMethods().includes(method);
  }

  nextStep(): void {
    if (!this.validateStep(this.currentStep())) return;
    this.saveDraft(false);
    this.currentStep.update((step) => Math.min(5, step + 1));
    this.scrollToTop();
  }

  previousStep(): void {
    this.currentStep.update((step) => Math.max(1, step - 1));
    this.showValidationSummary.set(false);
    this.scrollToTop();
  }

  goToStep(step: number): void {
    if (!this.canEdit()) return;
    if (step > this.currentStep() && !this.validateStep(this.currentStep())) return;
    this.currentStep.set(step);
    this.scrollToTop();
  }

  saveDraft(showConfirmation = true): void {
    const user = this.authSession.currentUser();
    if (!user || !this.canEdit()) return;

    this.isSaving.set(true);
    const application = this.applicationService.saveDraft(user.id, this.payload(), this.currentStep());
    this.application.set(application);
    this.isSaving.set(false);

    if (showConfirmation) {
      this.saveMessage.set('Borrador guardado en este navegador.');
      setTimeout(() => this.saveMessage.set(''), 2600);
    }
  }

  submitApplication(): void {
    const user = this.authSession.currentUser();
    if (!user || !this.validateAll()) return;

    this.isSaving.set(true);
    const application = this.applicationService.submit(user.id, this.payload());
    this.application.set(application);
    this.isSaving.set(false);
    this.scrollToTop();
  }

  editRequestedChanges(): void {
    const user = this.authSession.currentUser();
    if (!user || this.status() !== 'changes_requested') return;
    this.applicationService.reopenForChanges(user.id);
    this.application.set(this.applicationService.getByUser(user.id));
    this.currentStep.set(1);
    this.scrollToTop();
  }

  fieldInvalid(name: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || this.showValidationSummary());
  }

  statusLabel(status: SellerApplicationStatus): string {
    const labels: Record<SellerApplicationStatus, string> = {
      draft: 'Borrador',
      submitted: 'Solicitud enviada',
      under_review: 'En revisión',
      changes_requested: 'Cambios solicitados',
      approved: 'Aprobada',
      rejected: 'No aprobada',
    };
    return labels[status];
  }

  private validateStep(step: number): boolean {
    const controlsByStep: Record<number, (keyof typeof this.form.controls)[]> = {
      1: ['businessName', 'responsibleName', 'email', 'whatsapp', 'ruc'],
      2: ['businessType', 'description', 'priceFrom', 'priceTo'],
      3: ['district', 'serviceZones', 'preparationTime', 'availability'],
      4: ['experienceYears', 'instagram', 'facebook', 'portfolioUrl', 'differentiator'],
      5: ['acceptedTerms', 'confirmsTruthfulness'],
    };

    const controls = controlsByStep[step] ?? [];
    controls.forEach((name) => this.form.controls[name].markAsTouched());

    const controlsValid = controls.every((name) => this.form.controls[name].valid);
    const categoriesValid = step !== 2 || this.selectedCategories().length > 0;
    const deliveryValid = step !== 3 || this.selectedDeliveryMethods().length > 0;
    const priceValid = step !== 2 || this.priceRangeValid();
    const valid = controlsValid && categoriesValid && deliveryValid && priceValid;

    this.showValidationSummary.set(!valid);
    return valid;
  }

  private validateAll(): boolean {
    this.form.markAllAsTouched();
    const valid =
      this.form.valid &&
      this.selectedCategories().length > 0 &&
      this.selectedDeliveryMethods().length > 0 &&
      this.priceRangeValid();
    this.showValidationSummary.set(!valid);
    return valid;
  }

  private priceRangeValid(): boolean {
    const from = this.form.controls.priceFrom.value;
    const to = this.form.controls.priceTo.value;
    return from === null || to === null || to >= from;
  }

  private payload(): SellerApplicationPayload {
    const value = this.form.getRawValue();
    return {
      ...value,
      businessName: value.businessName.trim(),
      responsibleName: value.responsibleName.trim(),
      email: value.email.trim().toLowerCase(),
      whatsapp: value.whatsapp.trim(),
      ruc: value.ruc.trim(),
      categories: this.selectedCategories(),
      description: value.description.trim(),
      district: value.district.trim(),
      serviceZones: value.serviceZones.trim(),
      deliveryMethods: this.selectedDeliveryMethods(),
      instagram: value.instagram.trim(),
      facebook: value.facebook.trim(),
      portfolioUrl: value.portfolioUrl.trim(),
      differentiator: value.differentiator.trim(),
    };
  }

  private scrollToTop(): void {
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
