import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BuildAdvisorService } from '../../data-access/build-advisor/build-advisor.service';
import {
  BuildRequirements,
  PcComponent,
  RecommendedBuild,
  ValidationCheck,
} from '../../shared/models/pc-build.model';

@Component({
  selector: 'app-builder',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './builder.html',
  styleUrl: './builder.css',
})
export class BuilderComponent {
  private readonly buildAdvisor = inject(BuildAdvisorService);

  readonly requirementsForm = new FormGroup({
    budget: new FormControl(4500, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1800), Validators.max(12000)],
    }),
    useCase: new FormControl<BuildRequirements['useCase']>('gaming_streaming', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    resolution: new FormControl('1080p competitivo', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    streaming: new FormControl(true, { nonNullable: true }),
    rgb: new FormControl(false, { nonNullable: true }),
    brandPreference: new FormControl('NVIDIA si entra en presupuesto', { nonNullable: true }),
    notes: new FormControl('', { nonNullable: true }),
  });

  readonly recommendedBuild = signal<RecommendedBuild | null>(
    this.buildAdvisor.generateBuild(this.requirementsForm.getRawValue()),
  );

  generateBuild(): void {
    if (this.requirementsForm.invalid) {
      this.requirementsForm.markAllAsTouched();
      return;
    }

    this.recommendedBuild.set(this.buildAdvisor.generateBuild(this.requirementsForm.getRawValue()));
  }

  clearBuild(): void {
    this.recommendedBuild.set(null);
  }

  trackComponent(_: number, component: PcComponent): string {
    return `${component.category}-${component.name}`;
  }

  trackCheck(_: number, check: ValidationCheck): string {
    return check.label;
  }
}
