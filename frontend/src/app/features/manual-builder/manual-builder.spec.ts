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

  it('should select a provider profile', () => {
    const provider = component.providers()[1];

    component.selectProvider(provider);

    expect(component.selectedProvider().id).toBe(provider.id);
  });
});
