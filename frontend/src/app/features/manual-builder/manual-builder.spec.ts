import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ManualBuilderComponent } from './manual-builder';

describe('ManualBuilderComponent', () => {
  let component: ManualBuilderComponent;
  let fixture: ComponentFixture<ManualBuilderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManualBuilderComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ManualBuilderComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should add selected products to the build', () => {
    const cpu = component.products.find((product) => product.category === 'CPU');

    if (!cpu) {
      throw new Error('CPU mock product is required');
    }

    component.selectProduct(cpu);

    expect(component.completedCount()).toBe(1);
    expect(component.total()).toBe(cpu.price);
  });
});
