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

  it('should select a seller profile', () => {
    const seller = component.sellers()[1];

    component.selectSeller(seller);

    expect(component.selectedSeller().id).toBe(seller.id);
  });
});
