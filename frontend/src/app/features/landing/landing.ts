/**
 * =========================================================================
 * COMPONENTE CONTENEDOR: LandingComponent
 * DESCRIPCIÓN: Página principal que orquesta los subcomponentes de marketing.
 * =========================================================================
 */
import { Component } from '@angular/core';
import { HeroConsoleComponent } from './hero-console/hero-console';
import { TechFeaturesComponent } from './tech-features/tech-features';
import { SaasStoresComponent } from './saas-stores/saas-stores';
@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [HeroConsoleComponent, TechFeaturesComponent, SaasStoresComponent],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class LandingComponent {}

