import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { HeroConsoleComponent } from './hero-console';

describe('HeroConsole', () => {
  let component: HeroConsoleComponent;
  let fixture: ComponentFixture<HeroConsoleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeroConsoleComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(HeroConsoleComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
