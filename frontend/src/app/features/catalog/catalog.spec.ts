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
    component.applyQuickCategory('GPU');

    expect(component.filteredProducts().every((product) => product.category === 'GPU')).toBe(true);
  });
});
