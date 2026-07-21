import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { PedidosClienteStore } from '../../estado/pedidos-cliente.store';
import { PedidoClienteResumen } from '../../modelos/pedido-cliente.model';
import { PaginaClientePedidos } from './pagina-cliente-pedidos';

describe('PaginaClientePedidos', () => {
  let harness: RouterTestingHarness;
  let pedidos: WritableSignal<PedidoClienteResumen[]>;
  let storeMock: {
    pedidos: typeof pedidos;
    paginaActual: WritableSignal<number>;
    totalElementos: WritableSignal<number>;
    totalPaginas: WritableSignal<number>;
    ultimaPagina: WritableSignal<boolean>;
    cargando: WritableSignal<boolean>;
    mensajeError: WritableSignal<string | null>;
    cargarListado: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    pedidos = signal([]);
    storeMock = {
      pedidos,
      paginaActual: signal(0),
      totalElementos: signal(0),
      totalPaginas: signal(1),
      ultimaPagina: signal(true),
      cargando: signal(false),
      mensajeError: signal<string | null>(null),
      cargarListado: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: PedidosClienteStore, useValue: storeMock },
        provideRouter([
          { path: 'cliente/pedidos', component: PaginaClientePedidos },
          { path: 'cliente/pedidos/:idPedido', component: PaginaClientePedidos },
        ]),
      ],
    });

    harness = await RouterTestingHarness.create();
  });

  it('restaura filtros y ordenamiento válidos desde la URL', async () => {
    const pagina = await abrirPagina(
      '/cliente/pedidos?page=2&size=25&q=%20regalo%20&estado=en_preparacion&estadoPago=CON_SALDO&sort=fechaEntrega,asc',
    );

    expect(storeMock.cargarListado).toHaveBeenCalledWith({
      page: 2,
      size: 25,
      q: 'regalo',
      estado: 'EN_PREPARACION',
      estadoPago: 'CON_SALDO',
      sort: 'fechaEntrega,asc',
    });
    expect(pagina.formularioFiltros.getRawValue()).toEqual({
      q: 'regalo',
      estado: 'EN_PREPARACION',
      estadoPago: 'CON_SALDO',
      sort: 'fechaEntrega,asc',
    });
  });

  it('descarta parámetros inválidos antes de consultar el backend', async () => {
    await abrirPagina(
      '/cliente/pedidos?page=-1&size=200&estado=INVENTADO&estadoPago=OTRO&sort=campo,asc',
    );

    expect(storeMock.cargarListado).toHaveBeenCalledWith({
      page: 0,
      size: 10,
      q: undefined,
      estado: undefined,
      estadoPago: undefined,
      sort: 'fechaCreacion,desc',
    });
  });

  it('sincroniza una vista rápida por estado con la URL', async () => {
    const pagina = await abrirPagina('/cliente/pedidos?q=box');

    pagina.aplicarEstadoRapido('LISTO');
    await harness.fixture.whenStable();

    const router = TestBed.inject(Router);
    expect(router.parseUrl(router.url).queryParams).toMatchObject({
      q: 'box',
      estado: 'LISTO',
      page: '0',
    });
    expect(storeMock.cargarListado).toHaveBeenLastCalledWith(
      expect.objectContaining({ q: 'box', estado: 'LISTO', page: 0 }),
    );
  });

  it('presenta una tarjeta móvil con pago y seguimiento visual accesible', async () => {
    pedidos.set([crearPedido()]);
    storeMock.totalElementos.set(1);

    await abrirPagina('/cliente/pedidos');

    const texto = textoPagina();
    expect(texto).toContain('Pedido #42');
    expect(texto).toContain('En preparación');
    expect(texto).toContain('53% pagado');
    expect(texto).not.toContain('EN_PREPARACION');

    const pasoActual = harness.routeNativeElement?.querySelector(
      '[data-paso="actual"][aria-current="step"]',
    );
    const progreso = harness.routeNativeElement?.querySelector('[role="progressbar"]');
    const detalle = harness.routeNativeElement?.querySelector(
      '[aria-label="Ver detalle del pedido 42"]',
    );

    expect(pasoActual?.textContent).toContain('Preparación');
    expect(progreso?.getAttribute('aria-valuenow')).toBe('53');
    expect(detalle?.getAttribute('href')).toBe('/cliente/pedidos/42');
  });

  async function abrirPagina(url: string): Promise<PaginaClientePedidos> {
    const pagina = await harness.navigateByUrl(url, PaginaClientePedidos);
    await harness.fixture.whenStable();
    return pagina;
  }

  function textoPagina(): string {
    return (harness.routeNativeElement?.textContent ?? '').replace(/\s+/g, ' ').trim();
  }
});

function crearPedido(): PedidoClienteResumen {
  return {
    idPedido: 42,
    nombreTienda: 'Detalles REGALIA',
    tipoEntrega: 'Recojo en tienda',
    fechaEntrega: '2026-07-25',
    estadoPedido: 'EN_PREPARACION',
    total: 150,
    montoPagado: 80,
    saldoPendiente: 70,
    fechaCreacion: '2026-07-20T10:30:00',
  };
}
