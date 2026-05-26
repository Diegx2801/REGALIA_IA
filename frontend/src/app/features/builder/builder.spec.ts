import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BuilderComponent } from './builder';

describe('BuilderComponent', () => {
  let component: BuilderComponent;
  let fixture: ComponentFixture<BuilderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BuilderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BuilderComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should generate a recommended build', () => {
    component.generateBuild();

    expect(component.recommendedBuild()).toBeTruthy();
  });
});
