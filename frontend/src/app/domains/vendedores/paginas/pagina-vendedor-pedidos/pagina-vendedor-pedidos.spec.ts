import { Component, signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { VendedorPanelStore } from '../../estado/vendedor-panel.store';
import {
  PedidoRecibidoDetalle,
  PedidoRecibidoResumen,
  TiendaVendedor,
} from '../../modelos/vendedor.model';
import { PaginaVendedorPedidos } from './pagina-vendedor-pedidos';

@Component({ template: '' })
class PaginaVaciaPrueba {}

describe('PaginaVendedorPedidos', () => {
  let harness: RouterTestingHarness;
  let pedidos: WritableSignal<PedidoRecibidoResumen[]>;
  let tiendas: WritableSignal<TiendaVendedor[]>;
  let totalPedidos: WritableSignal<number>;
  let storeMock: {
    pedidos: typeof pedidos;
    tiendas: typeof tiendas;
    totalPedidos: typeof totalPedidos;
    paginaPedidosActual: WritableSignal<number>;
    totalPaginasPedidos: WritableSignal<number>;
    ultimaPaginaPedidos: WritableSignal<boolean>;
    cargandoPedidos: WritableSignal<boolean>;
    mensajeErrorPedidos: WritableSignal<string | null>;
    mensajeErrorTiendasPedidos: WritableSignal<string | null>;
    idPedidoSeleccionado: WritableSignal<number | null>;
    pedidoDetalle: WritableSignal<PedidoRecibidoDetalle | null>;
    cargandoDetallePedido: WritableSignal<boolean>;
    mensajeErrorDetallePedido: WritableSignal<string | null>;
    cargarTiendasParaPedidos: ReturnType<typeof vi.fn>;
    cargarPedidosPaginados: ReturnType<typeof vi.fn>;
    seleccionarPedido: ReturnType<typeof vi.fn>;
    cancelarGestionPedidos: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    pedidos = signal([]);
    tiendas = signal([crearTienda(10), crearTienda(20)]);
    totalPedidos = signal(0);
    storeMock = {
      pedidos,
      tiendas,
      totalPedidos,
      paginaPedidosActual: signal(0),
      totalPaginasPedidos: signal(1),
      ultimaPaginaPedidos: signal(true),
      cargandoPedidos: signal(false),
      mensajeErrorPedidos: signal<string | null>(null),
      mensajeErrorTiendasPedidos: signal<string | null>(null),
      idPedidoSeleccionado: signal<number | null>(null),
      pedidoDetalle: signal<PedidoRecibidoDetalle | null>(null),
      cargandoDetallePedido: signal(false),
      mensajeErrorDetallePedido: signal<string | null>(null),
      cargarTiendasParaPedidos: vi.fn(),
      cargarPedidosPaginados: vi.fn(),
      seleccionarPedido: vi.fn(),
      cancelarGestionPedidos: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: VendedorPanelStore, useValue: storeMock },
        provideRouter([
          { path: 'vendedor/pedidos', component: PaginaVendedorPedidos },
          { path: 'vendedor/tiendas/:idTienda/pedidos', component: PaginaVendedorPedidos },
          { path: 'salida', component: PaginaVaciaPrueba },
        ]),
      ],
    });

    harness = await RouterTestingHarness.create();
  });

  it('construye la consulta general desde parámetros válidos y carga solo las tiendas necesarias', async () => {
    const pagina = await abrirPagina(
      '/vendedor/pedidos?page=2&size=25&idTienda=10&q=%20cliente%20&estado=en_preparacion&estadoPago=con_saldo&sort=saldoPendiente,desc',
    );

    expect(storeMock.cargarTiendasParaPedidos).toHaveBeenCalledOnce();
    expect(storeMock.cargarPedidosPaginados).toHaveBeenCalledOnce();
    expect(storeMock.cargarPedidosPaginados).toHaveBeenCalledWith({
      page: 2,
      size: 25,
      idTienda: 10,
      q: 'cliente',
      estado: 'EN_PREPARACION',
      estadoPago: 'CON_SALDO',
      sort: 'saldoPendiente,desc',
    });
    expect(pagina.idTiendaFija()).toBeNull();
    expect(pagina.formularioFiltros.getRawValue()).toMatchObject({
      idTienda: '10',
      q: 'cliente',
      estado: 'EN_PREPARACION',
      estadoPago: 'CON_SALDO',
      sort: 'saldoPendiente,desc',
    });
  });

  it('descarta parámetros inválidos antes de consultar el backend', async () => {
    await abrirPagina(
      '/vendedor/pedidos?page=-3&size=500&idTienda=texto&estado=INVENTADO&estadoPago=OTRO&sort=campo,asc',
    );

    expect(storeMock.cargarPedidosPaginados).toHaveBeenCalledWith({
      page: 0,
      size: 10,
      idTienda: undefined,
      q: undefined,
      estado: undefined,
      estadoPago: undefined,
      sort: 'fechaCreacion,desc',
    });
  });

  it('fija la tienda de la ruta e ignora una tienda distinta en la URL', async () => {
    const pagina = await abrirPagina('/vendedor/tiendas/10/pedidos?idTienda=20&page=1');

    expect(pagina.idTiendaFija()).toBe(10);
    expect(storeMock.cargarPedidosPaginados).toHaveBeenCalledWith(
      expect.objectContaining({ idTienda: 10, page: 1 }),
    );
    expect(textoPagina()).toContain('Pedidos de Regalos 10');
    expect(textoPagina()).toContain('Operación de tienda');
    expect(
      harness.routeNativeElement?.querySelector('select[formControlName="idTienda"]'),
    ).toBeNull();
  });

  it('sincroniza filtros y vistas rápidas en la URL sin duplicar el estado local', async () => {
    const pagina = await abrirPagina('/vendedor/pedidos');
    pagina.formularioFiltros.patchValue({
      idTienda: '20',
      q: '  cliente@regalia.test  ',
      estado: 'LISTO',
      estadoPago: 'CON_SALDO',
      sort: 'total,desc',
    });

    pagina.aplicarFiltros();
    await harness.fixture.whenStable();

    const router = TestBed.inject(Router);
    expect(router.parseUrl(router.url).queryParams).toEqual({
      idTienda: '20',
      q: 'cliente@regalia.test',
      estado: 'LISTO',
      estadoPago: 'CON_SALDO',
      sort: 'total,desc',
    });
    expect(storeMock.cargarPedidosPaginados).toHaveBeenLastCalledWith(
      expect.objectContaining({
        idTienda: 20,
        q: 'cliente@regalia.test',
        estado: 'LISTO',
        estadoPago: 'CON_SALDO',
        sort: 'total,desc',
      }),
    );

    pagina.aplicarVistaRapida('con-saldo');
    await harness.fixture.whenStable();

    expect(router.parseUrl(router.url).queryParams['estado']).toBeUndefined();
    expect(router.parseUrl(router.url).queryParams['estadoPago']).toBe('CON_SALDO');
    expect(pagina.vistaRapidaActiva()).toBe('con-saldo');
  });

  it('renderiza pedidos con estados comprensibles, moneda local y una acción accesible', async () => {
    const pedido = crearPedido();
    pedidos.set([pedido]);
    totalPedidos.set(1);

    const pagina = await abrirPagina('/vendedor/pedidos');
    const texto = textoPagina();
    expect(texto).toContain('Nuevo · reservado');
    expect(texto).toContain('Pago parcial');
    expect(texto).toContain('cliente@regalia.test');
    expect(texto).toMatch(/S\/\s*150\.00/);
    expect(texto).not.toContain('RESERVADO');

    const botonDetalle = harness.routeNativeElement?.querySelector<HTMLButtonElement>(
      '[aria-label="Ver detalle del pedido 42"]',
    );
    expect(botonDetalle).not.toBeNull();
    expect(botonDetalle?.getAttribute('aria-pressed')).toBe('false');

    pagina.abrirDetalle(pedido);
    expect(storeMock.seleccionarPedido).toHaveBeenCalledWith(42);
    expect(pagina.dialogoDetalleAbierto()).toBe(true);
  });

  it('cancela solicitudes de listado y detalle al abandonar la pantalla', async () => {
    await abrirPagina('/vendedor/pedidos');

    await harness.navigateByUrl('/salida', PaginaVaciaPrueba);
    await harness.fixture.whenStable();

    expect(storeMock.cancelarGestionPedidos).toHaveBeenCalledOnce();
  });

  async function abrirPagina(url: string): Promise<PaginaVendedorPedidos> {
    const pagina = await harness.navigateByUrl(url, PaginaVendedorPedidos);
    await harness.fixture.whenStable();
    return pagina;
  }

  function textoPagina(): string {
    return (harness.routeNativeElement?.textContent ?? '').replace(/\s+/g, ' ').trim();
  }
});

function crearTienda(idTienda: number): TiendaVendedor {
  return {
    idTienda,
    nombre: `Regalos ${idTienda}`,
    descripcion: 'Regalos personalizados',
    direccionReferencia: 'Lima',
    estadoRevision: 'APROBADA',
    formalizada: true,
    urlLogo: null,
    urlPortada: null,
    idDocumentoFiscal: 1,
    rubros: [{ idRubro: 1, nombre: 'Regalos' }],
    estado: true,
  };
}

function crearPedido(): PedidoRecibidoResumen {
  return {
    idPedido: 42,
    correoCliente: 'cliente@regalia.test',
    idTienda: 10,
    nombreTienda: 'Regalos 10',
    fechaEntrega: null,
    estadoPedido: 'RESERVADO',
    total: 150,
    montoPagado: 80,
    saldoPendiente: 70,
    cantidadItems: 2,
    fechaCreacion: '2026-07-20T10:30:00',
  };
}
