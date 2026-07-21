import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdministracionPanelStore } from '../../estado/administracion-panel.store';
import { PaginaAdminResumen } from './pagina-admin-resumen';

const tiendaPendiente = {
  idTienda: 20,
  idVendedor: 2,
  idUsuario: 3,
  nombre: 'Detalles con cariño',
  descripcion: '',
  direccionReferencia: '',
  vendedor: 'Ana Torres',
  correoVendedor: 'ana@regalia.test',
  estadoRevision: 'PENDIENTE',
  formalizada: false,
  idDocumentoFiscal: null,
  numeroDocumentoFiscal: null,
  rubros: ['Regalos personalizados'],
  estado: true,
  fechaCreacion: '2026-07-18T12:00:00Z',
  fechaActualizacion: '2026-07-19T12:00:00Z',
};

const pedidoConSaldo = {
  idPedido: 31,
  idUsuario: 3,
  idTienda: 20,
  nombreTienda: 'Detalles con cariño',
  tipoEntrega: 'Delivery',
  fechaEntrega: null,
  observacion: '',
  estadoPedido: 'CONFIRMADO',
  subtotal: 100,
  total: 100,
  montoPagado: 40,
  saldoPendiente: 60,
  cantidadItems: 2,
  productos: [],
  estado: true,
  fechaCreacion: '2026-07-20T08:00:00Z',
  fechaActualizacion: '2026-07-20T10:00:00Z',
};

class AdministracionPanelStoreStub {
  readonly usuarios = signal([
    {
      idUsuario: 1,
      nombreCompleto: 'Cliente reciente',
      correo: 'cliente@regalia.test',
      telefono: '',
      estado: true,
      fechaCreacion: '2026-07-17T10:00:00Z',
    },
  ]);
  readonly vendedores = signal([
    {
      idVendedor: 2,
      idUsuario: 2,
      nombreCompleto: 'Ana Torres',
      correo: 'ana@regalia.test',
      verificado: true,
      tiendasActivas: 1,
      tiendasTotales: 1,
      estado: true,
      fechaCreacion: '2026-07-18T10:00:00Z',
      fechaActualizacion: null,
    },
  ]);
  readonly tiendas = signal([tiendaPendiente]);
  readonly tiendasPendientesResumen = signal([tiendaPendiente]);
  readonly pedidos = signal([
    pedidoConSaldo,
    { ...pedidoConSaldo, idPedido: 30, saldoPendiente: 0, montoPagado: 100 },
  ]);
  readonly totalUsuarios = signal(12);
  readonly totalVendedores = signal(5);
  readonly totalTiendas = signal(10);
  readonly totalPedidos = signal(8);
  readonly totalProductosVisibles = signal(24);
  readonly tiendasPendientes = signal(2);
  readonly pedidosConSaldo = signal(3);
  readonly ultimaActualizacion = signal<Date | null>(new Date('2026-07-20T12:00:00Z'));
  readonly cargandoResumen = signal(false);
  readonly procesandoTienda = signal<number | null>(null);
  readonly mensajeError = signal<string | null>(null);
  readonly mensajeExito = signal<string | null>(null);
  readonly montoPagado = signal(140);
  readonly cargarResumen = vi.fn();
  readonly cambiarEstadoTienda = vi.fn();
}

describe('PaginaAdminResumen', () => {
  let fixture: ComponentFixture<PaginaAdminResumen>;
  let store: AdministracionPanelStoreStub;

  beforeEach(async () => {
    store = new AdministracionPanelStoreStub();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AdministracionPanelStore, useValue: store }],
    });

    fixture = TestBed.createComponent(PaginaAdminResumen);
    await fixture.whenStable();
  });

  afterEach(() => TestBed.resetTestingModule());

  it('presenta alertas exactas y sus rutas de recuperación', () => {
    const radar = fixture.nativeElement.querySelector('.admin-resumen__radar') as HTMLElement;
    const alertas = Array.from(
      fixture.nativeElement.querySelectorAll('.admin-resumen__alerta'),
    ) as HTMLAnchorElement[];

    expect(radar.textContent).toContain('5');
    expect(alertas.map((alerta) => alerta.getAttribute('href'))).toEqual([
      '/admin/tiendas',
      '/admin/pedidos',
    ]);
    expect(alertas[0].textContent).toContain('2');
    expect(alertas[1].textContent).toContain('3');
  });

  it('ordena actividad real por fecha y enlaza cada registro con su contexto', () => {
    const actividades = Array.from(
      fixture.nativeElement.querySelectorAll('.admin-resumen__actividad-item'),
    ) as HTMLAnchorElement[];

    expect(actividades[0].getAttribute('href')).toBe('/admin/pedidos/31');
    expect(actividades[0].textContent).toContain('Pedido #31');
    expect(actividades.at(-1)?.getAttribute('href')).toBe('/admin/usuarios');
  });

  it('excluye pedidos pagados de los movimientos críticos', () => {
    const movimientos = fixture.nativeElement.querySelectorAll('.admin-resumen__pedido');

    expect(movimientos).toHaveLength(1);
    expect((movimientos[0] as HTMLAnchorElement).getAttribute('href')).toBe('/admin/pedidos/31');
  });

  it('permite actualizar el resumen de manera explícita', async () => {
    const botones = fixture.nativeElement.querySelectorAll(
      'button',
    ) as NodeListOf<HTMLButtonElement>;
    const botonActualizar = Array.from(botones).find((boton) =>
      boton.textContent?.includes('Actualizar resumen'),
    ) as HTMLButtonElement;

    botonActualizar.click();
    await fixture.whenStable();

    expect(store.cargarResumen).toHaveBeenNthCalledWith(1);
    expect(store.cargarResumen).toHaveBeenNthCalledWith(2, true);
  });
});
