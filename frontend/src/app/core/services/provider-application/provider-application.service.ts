import { Injectable, signal } from '@angular/core';

export type ProviderApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'changes_requested'
  | 'approved'
  | 'rejected';

export interface ProviderApplicationPayload {
  businessName: string;
  responsibleName: string;
  email: string;
  whatsapp: string;
  ruc: string;
  businessType: string;
  categories: string[];
  description: string;
  priceFrom: number | null;
  priceTo: number | null;
  customWork: boolean;
  district: string;
  serviceZones: string;
  deliveryMethods: string[];
  preparationTime: string;
  availability: string;
  experienceYears: number | null;
  instagram: string;
  facebook: string;
  portfolioUrl: string;
  differentiator: string;
  acceptedTerms: boolean;
  confirmsTruthfulness: boolean;
}

export interface ProviderApplication extends ProviderApplicationPayload {
  id: string;
  userId: number;
  status: ProviderApplicationStatus;
  currentStep: number;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  adminNotes: string;
}

@Injectable({ providedIn: 'root' })
export class ProviderApplicationService {
  private readonly storageKey = 'regalia_provider_applications_v1';
  private readonly applicationsSignal = signal<ProviderApplication[]>(this.readStorage());

  readonly applications = this.applicationsSignal.asReadonly();

  getByUser(userId: number): ProviderApplication | null {
    return this.applicationsSignal().find((application) => application.userId === userId) ?? null;
  }

  saveDraft(
    userId: number,
    payload: ProviderApplicationPayload,
    currentStep: number,
  ): ProviderApplication {
    const existing = this.getByUser(userId);
    const now = new Date().toISOString();
    const application: ProviderApplication = {
      ...payload,
      id: existing?.id ?? `provider-${userId}-${Date.now()}`,
      userId,
      status: existing?.status === 'changes_requested' ? 'changes_requested' : 'draft',
      currentStep,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      submittedAt: existing?.submittedAt ?? null,
      adminNotes: existing?.adminNotes ?? '',
    };

    this.upsert(application);
    return application;
  }

  submit(userId: number, payload: ProviderApplicationPayload): ProviderApplication {
    const existing = this.getByUser(userId);
    const now = new Date().toISOString();
    const application: ProviderApplication = {
      ...payload,
      id: existing?.id ?? `provider-${userId}-${Date.now()}`,
      userId,
      status: 'submitted',
      currentStep: 5,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      submittedAt: now,
      adminNotes: '',
    };

    this.upsert(application);
    return application;
  }

  updateStatus(
    applicationId: string,
    status: Exclude<ProviderApplicationStatus, 'draft' | 'submitted'>,
    adminNotes = '',
  ): void {
    const updated = this.applicationsSignal().map((application) =>
      application.id === applicationId
        ? {
            ...application,
            status,
            adminNotes: adminNotes.trim(),
            updatedAt: new Date().toISOString(),
          }
        : application,
    );

    this.persist(updated);
  }

  reopenForChanges(userId: number): void {
    const updated = this.applicationsSignal().map((application) =>
      application.userId === userId && application.status === 'changes_requested'
        ? { ...application, status: 'draft' as const, updatedAt: new Date().toISOString() }
        : application,
    );
    this.persist(updated);
  }

  private upsert(application: ProviderApplication): void {
    const applications = this.applicationsSignal();
    const index = applications.findIndex((item) => item.id === application.id);
    const updated = [...applications];

    if (index >= 0) updated[index] = application;
    else updated.unshift(application);

    this.persist(updated);
  }

  private persist(applications: ProviderApplication[]): void {
    this.applicationsSignal.set(applications);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.storageKey, JSON.stringify(applications));
    }
  }

  private readStorage(): ProviderApplication[] {
    if (typeof localStorage === 'undefined') return [];

    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return [];

    try {
      const value = JSON.parse(raw) as unknown;
      return Array.isArray(value) ? (value as ProviderApplication[]) : [];
    } catch {
      return [];
    }
  }
}
