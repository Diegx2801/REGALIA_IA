import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TechFeatures } from './tech-features';

describe('TechFeatures', () => {
  let component: TechFeatures;
  let fixture: ComponentFixture<TechFeatures>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TechFeatures],
    }).compileComponents();

    fixture = TestBed.createComponent(TechFeatures);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
