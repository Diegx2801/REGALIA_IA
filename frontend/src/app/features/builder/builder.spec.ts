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

  it('should generate provider matches', () => {
    component.generateMatches();

    expect(component.recommendations().length).toBeGreaterThan(0);
  });

  it('should render the default match flow', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Dulce Detalle Trujillo');
  });
});
