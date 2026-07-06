import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { BuilderComponent } from './builder';
import { RecomendacionProductoConstructor } from './models/builder.model';
import { BuilderFlowService } from './services/builder-flow.service';

describe('BuilderComponent', () => {
  let component: BuilderComponent;
  let fixture: ComponentFixture<BuilderComponent>;
  let flujoBuilderMock: Pick<BuilderFlowService, 'obtenerRecomendaciones'>;

  const recomendacionMock: RecomendacionProductoConstructor = {
    producto: {
      id: 1,
      title: 'Mini torta personalizada',
      seller: 'Regalos Dulce Encanto',
      sellerId: 1,
      sellerCategory: 'Repostería personalizada',
      occasion: 'Graduación',
      price: 120,
      rating: 4.8,
      reviews: 12,
      imageUrl: '/images/regalia-hero-gift.png',
      imagePosition: '50% 50%',
      verified: true,
      badges: ['Torta personalizada'],
      shortDescription: 'Torta recomendada para graduación.',
      description: 'Torta recomendada para graduación.',
      includes: ['Producto seleccionado'],
      deliveryTime: 'Entrega coordinada con vendedor',
      stockStatus: 'Stock disponible: 5',
      personalization: 'Personalización según disponibilidad del vendedor',
      maxQuantity: 5,
    },
    vendedor: null,
    puntaje: 96,
    motivo: 'Producto recomendado por IA.',
    interpretacion: {
      categoria: 'Repostería personalizada',
      ocasion: 'Graduación',
      estilo: 'elegante',
      urgencia: 'normal',
      ajustePresupuesto: 'dentro del presupuesto',
    },
    reserva: {
      estimatedOrder: 120,
      reservation: 24,
      platformCommission: 12,
      sellerCredit: 108,
    },
  };

  beforeEach(async () => {
    Element.prototype.scrollIntoView = vi.fn();

    flujoBuilderMock = {
      obtenerRecomendaciones: vi.fn().mockReturnValue(of({
        estado: 'success',
        recomendaciones: [recomendacionMock],
        mensaje: 'Recomendación generada por IA.',
      })),
    };

    await TestBed.configureTestingModule({
      imports: [BuilderComponent],
      providers: [{ provide: BuilderFlowService, useValue: flujoBuilderMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(BuilderComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should generate product recommendations', () => {
    component.generarRecomendaciones();

    expect(component.recomendaciones().length).toBeGreaterThan(0);
    expect(component.recomendaciones()[0].producto).toBeTruthy();
    expect(flujoBuilderMock.obtenerRecomendaciones).toHaveBeenCalled();
  });

  it('should render the default match flow', () => {
    component.generarRecomendaciones();
    component.irAFase('recomendaciones');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Mini torta personalizada');
  });
});
