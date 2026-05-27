import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RegaliaService } from '../../data-access/regalia/regalia.service';
import { RegaliaCategory, RegaliaProvider } from '../../shared/models/regalia.model';

@Component({
  selector: 'app-manual-builder',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './manual-builder.html',
  styleUrl: './manual-builder.css',
})
export class ManualBuilderComponent {
  private readonly regaliaService = inject(RegaliaService);

  readonly categories = this.regaliaService.getCategories();
  readonly providers = signal(this.regaliaService.getProviders());
  readonly selectedProvider = signal<RegaliaProvider>(this.providers()[0]);

  readonly providerForm = new FormGroup({
    businessName: new FormControl('Atelier Regalo Norte', { nonNullable: true }),
    category: new FormControl<RegaliaCategory>('Cajas sorpresa', { nonNullable: true }),
    priceFrom: new FormControl(60, { nonNullable: true }),
    deliveryTime: new FormControl('24 a 48 horas', { nonNullable: true }),
    whatsapp: new FormControl('999 000 000', { nonNullable: true }),
    availability: new FormControl('Disponible esta semana', { nonNullable: true }),
  });

  selectProvider(provider: RegaliaProvider): void {
    this.selectedProvider.set(provider);
  }

  trackProvider(_: number, provider: RegaliaProvider): number {
    return provider.id;
  }

  trackText(_: number, value: string): string {
    return value;
  }
}
