import { Component, signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
import { CheckoutApiService } from '../../../checkout/acceso-datos/checkout-api.service';
import { PedidosClienteStore } from '../../estado/pedidos-cliente.store';
import { PedidoCliente } from '../../modelos/pedido-cliente.model';
import { PaginaClienteDetallePedido } from './pagina-cliente-detalle-pedido';

@Component({ template: '' })
class PaginaVaciaPrueba {}

describe('PaginaClienteDetallePedido', () => {
  let harness: RouterTestingHarness;
  let pedidoDetalle: WritableSignal<PedidoCliente | null>;
  let checkoutApi: { crearSesionPagoRestante: ReturnType<typeof vi.fn> };
  let storeMock: {
    pedidoDetalle: typeof pedidoDetalle;
    cargandoDetalle: WritableSignal<boolean>;
    mensajeErrorDetalle: WritableSignal<string | null>;
    cargarDetalle: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    pedidoDetalle = signal<PedidoCliente | null>(crearPedido());
    checkoutApi = {
      crearSesionPagoRestante: vi.fn(() =>
        of({
          proveedor: 'MERCADO_PAGO',
          referenciaExterna: 'ref-42',
          monto: 70,
          moneda: 'PEN',
          urlRedireccion: null,
        }),
      ),
    };
    storeMock = {
      pedidoDetalle,
      cargandoDetalle: signal(false),
      mensajeErrorDetalle: signal<string | null>(null),
      cargarDetalle: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: PedidosClienteStore, useValue: storeMock },
        { provide: CheckoutApiService, useValue: checkoutApi },
        provideRouter([
          { path: 'cliente/pedidos', component: PaginaVaciaPrueba },
          {
            path: 'cliente/pedidos/:idPedido',
            component: PaginaClienteDetallePedido,
          },
        ]),
      ],
    });

    harness = await RouterTestingHarness.create();
  });

  it('carga el pedido propio y presenta seguimiento, productos, entrega y resumen económico', async () => {
    await abrirPagina('/cliente/pedidos/42');

    expect(storeMock.cargarDetalle).toHaveBeenCalledWith(42);
    const texto = textoPagina();
    expect(texto).toContain('Detalles REGALIA');
    expect(texto).toContain('La tienda está preparando tu regalo');
    expect(texto).toContain('2 unidades en este pedido');
    expect(texto).toContain('Dedicatoria para Ana');
    expect(texto).toContain('53% pagado');
    expect(texto).not.toContain('EN_PREPARACION');

    const pasoActual = harness.routeNativeElement?.querySelector(
      '[data-paso="actual"][aria-current="step"]',
    );
    const progreso = harness.routeNativeElement?.querySelector('[role="progressbar"]');
    expect(pasoActual?.textContent).toContain('Preparación');
    expect(progreso?.getAttribute('aria-valuenow')).toBe('53');
  });

  it('solo ofrece pagar saldo cuando el backend permite esa acción', async () => {
    const pagina = await abrirPagina('/cliente/pedidos/42');
    const boton = harness.routeNativeElement?.querySelector<HTMLButtonElement>(
      'button[data-variant], button.rg-boton--primario',
    );

    expect(textoPagina()).toContain('Pagar saldo pendiente');
    pagina.pagarSaldoPendiente(42);
    await harness.fixture.whenStable();

    expect(checkoutApi.crearSesionPagoRestante).toHaveBeenCalledWith(42);
    expect(textoPagina()).toContain('No pudimos abrir el proveedor de pago');
    expect(harness.routeNativeElement?.querySelector('[role="alert"]')).not.toBeNull();
    expect(boton).not.toBeNull();
  });

  it('muestra el estado terminal anulado y oculta el pago de saldo', async () => {
    pedidoDetalle.set({ ...crearPedido(), estadoPedido: 'ANULADO' });

    await abrirPagina('/cliente/pedidos/42');

    const texto = textoPagina();
    expect(texto).toContain('Este pedido fue anulado');
    expect(texto).toContain('El pago de saldo ya no está disponible');
    expect(texto).not.toContain('Pagar saldo pendiente');
    expect(harness.routeNativeElement?.querySelector('[aria-current="step"]')).toBeNull();
  });

  it('anuncia el retorno de pago confirmado y limpia los parámetros temporales', async () => {
    pedidoDetalle.set({ ...crearPedido(), montoPagado: 150, saldoPendiente: 0 });

    await abrirPagina('/cliente/pedidos/42?checkout=confirmacion&payment=success');

    expect(textoPagina()).toContain('Pago confirmado. Tu saldo está al día.');
    expect(TestBed.inject(Router).url).toBe('/cliente/pedidos/42');
  });

  it('redirige identificadores inválidos sin consultar el backend', async () => {
    await harness.navigateByUrl('/cliente/pedidos/invalido');
    await harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/cliente/pedidos');
    expect(storeMock.cargarDetalle).not.toHaveBeenCalled();
  });

  async function abrirPagina(url: string): Promise<PaginaClienteDetallePedido> {
    const pagina = await harness.navigateByUrl(url, PaginaClienteDetallePedido);
    await harness.fixture.whenStable();
    return pagina;
  }

  function textoPagina(): string {
    return (harness.routeNativeElement?.textContent ?? '').replace(/\s+/g, ' ').trim();
  }
});

function crearPedido(): PedidoCliente {
  return {
    idPedido: 42,
    idTienda: 7,
    nombreTienda: 'Detalles REGALIA',
    tipoEntrega: 'Entrega coordinada con vendedor',
    fechaEntrega: '2026-07-25',
    observacion: 'Dedicatoria para Ana',
    estadoPedido: 'EN_PREPARACION',
    subtotal: 150,
    total: 150,
    montoPagado: 80,
    saldoPendiente: 70,
    estado: true,
    fechaCreacion: '2026-07-20T10:30:00',
    fechaActualizacion: '2026-07-21T09:15:00',
    productos: [
      {
        idDetallePedido: 1,
        idProducto: 10,
        nombreProducto: 'Box premium',
        cantidad: 2,
        precioUnitario: 75,
        subtotal: 150,
      },
    ],
  };
}
