import { ViewportScroller } from '@angular/common';
import { AfterViewInit, Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthSessionService } from '../../core/services/auth/auth-session.service';
import { RegaliaService } from '../../core/services/data-access/regalia/regalia.service';
import { FeaturedProduct, OccasionShortcut } from '../../shared/models/regalia.model';
import { FestiveCalendarComponent } from './components/festive-calendar/festive-calendar';
import { HeroSearchComponent } from './components/hero-search/hero-search';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, FestiveCalendarComponent, HeroSearchComponent],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class LandingComponent implements AfterViewInit {
  private readonly regaliaService = inject(RegaliaService);
  private readonly router = inject(Router);
  private readonly viewportScroller = inject(ViewportScroller);
  private readonly authSession = inject(AuthSessionService);

  readonly occasionShortcuts: OccasionShortcut[] = this.regaliaService.getOccasionShortcuts();
  readonly featuredProducts: FeaturedProduct[] = this.regaliaService.getFeaturedProducts();
  readonly sellerRoute = computed(() =>
    this.authSession.role() === 'Cliente' ? '/cliente/solicitud-vendedor' : '/registro',
  );
  readonly sellerQueryParams = computed(() =>
    this.authSession.role() === 'Cliente' ? null : { origen: 'vendedor' },
  );

  ngAfterViewInit(): void {
    // Mantiene compatibilidad con la ruta /modelo desplazando al bloque de modelo de negocio.
    if (this.router.url.startsWith('/modelo')) {
      setTimeout(() => this.viewportScroller.scrollToAnchor('modelo'));
    }
  }
  trackOccasion(_: number, occasion: OccasionShortcut): string {
    return occasion.id;
  }

  trackProduct(_: number, product: FeaturedProduct): number {
    return product.id;
  }
}
