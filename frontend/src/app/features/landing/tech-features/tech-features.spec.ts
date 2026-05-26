import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TechFeaturesComponent } from './tech-features';

describe('TechFeatures', () => {
  let component: TechFeaturesComponent;
  let fixture: ComponentFixture<TechFeaturesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TechFeaturesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TechFeaturesComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
