import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  ProviderApplication,
  ProviderApplicationService,
  ProviderApplicationStatus,
} from '../../core/services/provider-application/provider-application.service';

type ApplicationFilter = 'all' | ProviderApplicationStatus;

@Component({
  selector: 'app-admin-provider-applications',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-provider-applications.html',
  styleUrl: './admin-provider-applications.css',
})
export class AdminProviderApplicationsComponent {
  private readonly applicationService = inject(ProviderApplicationService);

  readonly filter = signal<ApplicationFilter>('all');
  readonly selectedId = signal<string | null>(null);
  readonly actionMessage = signal('');
  readonly noteControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.maxLength(500)],
  });

  readonly applications = this.applicationService.applications;
  readonly visibleApplications = computed(() => {
    const applications = [...this.applications()].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
    return this.filter() === 'all'
      ? applications
      : applications.filter((application) => application.status === this.filter());
  });
  readonly selectedApplication = computed<ProviderApplication | null>(() => {
    const selectedId = this.selectedId();
    return this.applications().find((application) => application.id === selectedId) ?? null;
  });
  readonly pendingCount = computed(
    () => this.applications().filter((application) => ['submitted', 'under_review'].includes(application.status)).length,
  );
  readonly approvedCount = computed(
    () => this.applications().filter((application) => application.status === 'approved').length,
  );
  readonly changesCount = computed(
    () => this.applications().filter((application) => application.status === 'changes_requested').length,
  );

  setFilter(filter: ApplicationFilter): void {
    this.filter.set(filter);
    this.selectedId.set(null);
    this.noteControl.setValue('');
  }

  selectApplication(application: ProviderApplication): void {
    this.selectedId.set(application.id);
    this.noteControl.setValue(application.adminNotes ?? '');
    this.actionMessage.set('');
  }

  closeDetail(): void {
    this.selectedId.set(null);
    this.noteControl.setValue('');
  }

  startReview(application: ProviderApplication): void {
    this.updateStatus(application, 'under_review');
  }

  approve(application: ProviderApplication): void {
    this.updateStatus(application, 'approved');
  }

  requestChanges(application: ProviderApplication): void {
    const note = this.noteControl.value.trim();
    if (note.length < 10) {
      this.actionMessage.set('Escribe una observación clara de al menos 10 caracteres.');
      return;
    }
    this.updateStatus(application, 'changes_requested', note);
  }

  reject(application: ProviderApplication): void {
    const note = this.noteControl.value.trim();
    if (note.length < 10) {
      this.actionMessage.set('Indica el motivo de rechazo con al menos 10 caracteres.');
      return;
    }
    this.updateStatus(application, 'rejected', note);
  }

  statusLabel(status: ProviderApplicationStatus): string {
    const labels: Record<ProviderApplicationStatus, string> = {
      draft: 'Borrador',
      submitted: 'Recibida',
      under_review: 'En revisión',
      changes_requested: 'Cambios solicitados',
      approved: 'Aprobada',
      rejected: 'Rechazada',
    };
    return labels[status];
  }

  initials(application: ProviderApplication): string {
    return application.businessName
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }

  private updateStatus(
    application: ProviderApplication,
    status: 'under_review' | 'changes_requested' | 'approved' | 'rejected',
    note = this.noteControl.value,
  ): void {
    this.applicationService.updateStatus(application.id, status, note);
    this.noteControl.setValue(note);
    this.actionMessage.set(`Solicitud actualizada: ${this.statusLabel(status)}.`);
  }
}
