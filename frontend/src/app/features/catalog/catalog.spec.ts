import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CatalogComponent } from './catalog';

describe('CatalogComponent', () => {
  let component: CatalogComponent;
  let fixture: ComponentFixture<CatalogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CatalogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CatalogComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should filter by category', () => {
    component.applyCategory('Arreglos florales');

    expect(component.filteredSellers().every((seller) => seller.category === 'Arreglos florales')).toBe(true);
  });

  it('should render seller catalog', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Dulce Detalle Trujillo');
    expect(fixture.nativeElement.textContent).toContain('Vendedores locales');
  });
});
