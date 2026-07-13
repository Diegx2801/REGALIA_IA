import { Component, input } from '@angular/core';

export type VarianteSkeleton = 'producto' | 'tienda' | 'compacto';

@Component({
  selector: 'app-skeleton-card',
  templateUrl: './skeleton-card.html',
  styleUrl: './skeleton-card.css',
})
export class SkeletonCard {
  readonly variante = input<VarianteSkeleton>('producto');
}
