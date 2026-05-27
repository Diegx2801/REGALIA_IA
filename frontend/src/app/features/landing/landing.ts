import { ViewportScroller } from '@angular/common';
import { AfterViewInit, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { RegaliaService } from '../../core/services/data-access/regalia/regalia.service';
import { FeaturedProduct, OccasionShortcut } from '../../shared/models/regalia.model';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class LandingComponent implements AfterViewInit {
  private readonly regaliaService = inject(RegaliaService);
  private readonly router = inject(Router);
  private readonly viewportScroller = inject(ViewportScroller);

  readonly occasionShortcuts: OccasionShortcut[] = this.regaliaService.getOccasionShortcuts();
  readonly featuredProducts: FeaturedProduct[] = this.regaliaService.getFeaturedProducts();

  readonly searchForm = new FormGroup({
    occasion: new FormControl('Día de la Madre', { nonNullable: true }),
    budget: new FormControl('S/ 50 - S/ 300+', { nonNullable: true }),
    date: new FormControl('', { nonNullable: true }),
    district: new FormControl('Todos', { nonNullable: true }),
  });

  ngAfterViewInit(): void {
    if (this.router.url.startsWith('/modelo')) {
      setTimeout(() => this.viewportScroller.scrollToAnchor('modelo'));
    }
  }

  submitSearch(): void {
    void this.router.navigate(['/pedir-con-ia'], {
      queryParams: this.searchForm.getRawValue(),
    });
  }

  trackOccasion(_: number, occasion: OccasionShortcut): string {
    return occasion.id;
  }

  trackProduct(_: number, product: FeaturedProduct): number {
    return product.id;
  }
}
