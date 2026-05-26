import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeroConsole } from './hero-console';

describe('HeroConsole', () => {
  let component: HeroConsole;
  let fixture: ComponentFixture<HeroConsole>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeroConsole],
    }).compileComponents();

    fixture = TestBed.createComponent(HeroConsole);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
