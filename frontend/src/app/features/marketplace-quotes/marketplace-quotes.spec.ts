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

  it('should select an order', () => {
    const order = component.orders()[1];

    component.selectOrder(order);

    expect(component.selectedOrder().id).toBe(order.id);
  });
});
