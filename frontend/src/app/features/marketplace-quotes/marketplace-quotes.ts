import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MarketplaceQuotesService } from '../../data-access/marketplace-quotes/marketplace-quotes.service';
import { MarketplaceQuote } from '../../shared/models/marketplace-quote.model';
import { PcComponent } from '../../shared/models/pc-build.model';

@Component({
  selector: 'app-marketplace-quotes',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './marketplace-quotes.html',
  styleUrl: './marketplace-quotes.css',
})
export class MarketplaceQuotesComponent {
  private readonly quotesService = inject(MarketplaceQuotesService);

  readonly quotes = signal(this.quotesService.getQuotes());
  readonly selectedQuote = signal<MarketplaceQuote>(this.quotes()[0]);
  readonly averageTotal = computed(() => {
    const totals = this.quotes().map((quote) => quote.total);
    return Math.round(totals.reduce((sum, total) => sum + total, 0) / totals.length);
  });

  selectQuote(quote: MarketplaceQuote): void {
    this.selectedQuote.set(quote);
  }

  priceDifference(quote: MarketplaceQuote): number {
    return quote.total - this.averageTotal();
  }

  trackQuote(_: number, quote: MarketplaceQuote): number {
    return quote.id;
  }

  trackComponent(_: number, component: PcComponent): string {
    return `${component.category}-${component.name}`;
  }
}
