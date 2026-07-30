import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';
import { SesionAutenticacionService } from '../../../../core/autenticacion/sesion-autenticacion.service';
import { CarritoCheckoutService } from '../../../../core/carrito/carrito-checkout.service';
import { ItemCarrito } from '../../../../core/carrito/carrito.model';
import { ProductoApiService } from '../../../catalogo/acceso-datos/producto-api.service';
import { TipoEntregaApiService } from '../../../datos-maestros/acceso-datos/tipo-entrega-api.service';
import { CheckoutApiService } from '../../acceso-datos/checkout-api.service';
import { ResultadoCheckout } from '../../modelos/checkout.model';
import { PaginaSolicitudCheckout } from './pagina-solicitud-checkout';

describe('PaginaSolicitudCheckout', () => {
  let fixture: ComponentFixture<PaginaSolicitudCheckout>;
  let pagina: PaginaSolicitudCheckout;
  let autenticado: ReturnType<typeof signal<boolean>>;
  let usuarioActual: ReturnType<typeof signal<{ correoVerificado: boolean } | null>>;
  let rolCliente: boolean;
  let resultado$: Subject<ResultadoCheckout>;
  let checkoutApi: {
    obtenerOpcionesPagoInicial: ReturnType<typeof vi.fn>;
    crearSesionCheckout: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    autenticado = signal(true);
    usuarioActual = signal({ correoVerificado: true });
    rolCliente = true;
    resultado$ = new Subject<ResultadoCheckout>();
    checkoutApi = {
      obtenerOpcionesPagoInicial: vi.fn(() =>
        of([
          { codigo: 'SENA', nombre: 'Seña', descripcion: 'Reserva con un pago inicial.' },
          { codigo: 'PAGO_COMPLETO', nombre: 'Pago completo', descripcion: null },
        ]),
      ),
      crearSesionCheckout: vi.fn(() => resultado$),
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              routeConfig: { path: 'carrito' },
              paramMap: convertToParamMap({}),
            },
          },
        },
        {
          provide: SesionAutenticacionService,
          useValue: {
            estaAutenticado: autenticado,
            usuarioActual,
            tieneRol: vi.fn((roles: string[]) => rolCliente && roles.includes('CLIENTE')),
          },
        },
        { provide: ProductoApiService, useValue: { obtenerProductoPorId: vi.fn() } },
        {
          provide: TipoEntregaApiService,
          useValue: {
            obtenerTiposEntrega: vi.fn(() => of([{ idTipoEntrega: 1, nombre: 'Delivery' }])),
          },
        },
        { provide: CheckoutApiService, useValue: checkoutApi },
        { provide: CarritoCheckoutService, useValue: { items: signal([ITEM]) } },
      ],
    });
  });

  async function crearPagina(): Promise<void> {
    fixture = TestBed.createComponent(PaginaSolicitudCheckout);
    pagina = fixture.componentInstance;
    await fixture.whenStable();
  }

  it('organiza entrega, pago y personalización con datos reales del carrito', async () => {
    await crearPagina();

    expect(pagina.cargandoDatos()).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('Pedido y entrega');
    expect(fixture.nativeElement.textContent).toContain('Pago inicial');
    expect(fixture.nativeElement.textContent).toContain('Personalización');
    expect(fixture.nativeElement.textContent).toContain('PEN90.00');
  });

  it('muestra validaciones y no llama al backend con una fecha anterior', async () => {
    await crearPagina();
    pagina.formulario.controls.fechaEntrega.setValue('2020-01-01');

    pagina.continuarAlPago();
    await fixture.whenStable();

    expect(checkoutApi.crearSesionCheckout).not.toHaveBeenCalled();
    expect(pagina.mensajeError()).toContain('campos señalados');
    expect(fixture.nativeElement.textContent).toContain('Elige una fecha válida');
  });

  it('crea la sesión de pago al continuar con una solicitud válida', async () => {
    await crearPagina();

    pagina.continuarAlPago();
    expect(checkoutApi.crearSesionCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        proveedor: 'MERCADO_PAGO',
        idTienda: ITEM.idTienda,
        items: [{ idProducto: ITEM.idProducto, cantidad: ITEM.cantidad }],
      }),
    );

  });

  it('solicita login con retorno y no consulta pagos protegidos sin sesión', async () => {
    autenticado.set(false);
    await crearPagina();

    expect(checkoutApi.obtenerOpcionesPagoInicial).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Inicia sesión para continuar al pago');
    const enlace = fixture.nativeElement.querySelector('.checkout-login a') as HTMLAnchorElement;
    expect(enlace.getAttribute('href')).toContain('retorno=%2Fcheckout%2Fcarrito');
  });

  it('bloquea el checkout para un rol distinto de CLIENTE', async () => {
    rolCliente = false;
    await crearPagina();

    pagina.continuarAlPago();

    expect(checkoutApi.crearSesionCheckout).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('cuenta de cliente');
  });

  it('bloquea el checkout hasta verificar el correo', async () => {
    usuarioActual.set({ correoVerificado: false });
    await crearPagina();

    pagina.continuarAlPago();

    expect(checkoutApi.crearSesionCheckout).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Verifica tu correo');
  });
});

const ITEM: ItemCarrito = {
  idProducto: 7,
  idTienda: 3,
  nombre: 'Box aniversario',
  nombreTienda: 'Regalos del Sol',
  tipoProducto: 'PACK O BOX',
  precioUnitario: 90,
  cantidad: 1,
  stockDisponible: 5,
  urlImagen: '/assets/brand/producto-fallback.svg',
  observacion: 'Agregar una dedicatoria',
};
