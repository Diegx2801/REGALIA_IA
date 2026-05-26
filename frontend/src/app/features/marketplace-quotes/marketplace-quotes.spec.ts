import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MarketplaceQuotesComponent } from './marketplace-quotes';

describe('MarketplaceQuotesComponent', () => {
  let component: MarketplaceQuotesComponent;
  let fixture: ComponentFixture<MarketplaceQuotesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarketplaceQuotesComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(MarketplaceQuotesComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should select a marketplace quote', () => {
    const quote = component.quotes()[1];

    component.selectQuote(quote);

    expect(component.selectedQuote().id).toBe(quote.id);
  });
});
