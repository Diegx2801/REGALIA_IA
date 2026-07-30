import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
import { PanelAdministracionApiService } from '../../acceso-datos/panel-administracion-api.service';
import { PaginaAdminDetalle } from './pagina-admin-detalle';

describe('PaginaAdminDetalle', () => {
  let harness: RouterTestingHarness;
  let adminApi: {
    obtenerUsuarioPorId: ReturnType<typeof vi.fn>;
    obtenerVendedorPorId: ReturnType<typeof vi.fn>;
    obtenerTiendaPorId: ReturnType<typeof vi.fn>;
    obtenerPedidoPorId: ReturnType<typeof vi.fn>;
    obtenerCatalogoPublicoTienda: ReturnType<typeof vi.fn>;
    aprobarTienda: ReturnType<typeof vi.fn>;
    observarTienda: ReturnType<typeof vi.fn>;
    rechazarTienda: ReturnType<typeof vi.fn>;
    desactivarUsuario: ReturnType<typeof vi.fn>;
    reactivarUsuario: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    adminApi = {
      obtenerUsuarioPorId: vi.fn(() => of(crearUsuario())),
      obtenerVendedorPorId: vi.fn(() => of(crearVendedor())),
      obtenerTiendaPorId: vi.fn(() => of(crearTienda())),
      obtenerPedidoPorId: vi.fn(() => of(crearPedido())),
      obtenerCatalogoPublicoTienda: vi.fn(() =>
        of([
          {
            idProducto: 12,
            nombre: 'Caja personalizada',
            tipoProducto: 'Regalo personalizado',
            descripcion: 'Caja para una ocasión especial',
            precio: 60,
            stock: 8,
          },
        ]),
      ),
      aprobarTienda: vi.fn(() => of(crearTienda())),
      observarTienda: vi.fn(() => of({ ...crearTienda(), estadoRevision: 'OBSERVADA' })),
      rechazarTienda: vi.fn(() => of({ ...crearTienda(), estadoRevision: 'RECHAZADA' })),
      desactivarUsuario: vi.fn(() => of({ ...crearUsuario(), estado: false })),
      reactivarUsuario: vi.fn(() => of(crearUsuario())),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: PanelAdministracionApiService, useValue: adminApi },
        provideRouter([
          {
            path: 'usuarios/:idUsuario',
            component: PaginaAdminDetalle,
            data: { tipoDetalle: 'usuario' },
          },
          {
            path: 'vendedores/:idVendedor',
            component: PaginaAdminDetalle,
            data: { tipoDetalle: 'vendedor' },
          },
          {
            path: 'tiendas/:idTienda',
            component: PaginaAdminDetalle,
            data: { tipoDetalle: 'tienda' },
          },
          {
            path: 'pedidos/:idPedido',
            component: PaginaAdminDetalle,
            data: { tipoDetalle: 'pedido' },
          },
        ]),
      ],
    });

    harness = await RouterTestingHarness.create();
  });

  it('carga la cuenta indicada y permite desactivarla con confirmación', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const pagina = await harness.navigateByUrl('/usuarios/15', PaginaAdminDetalle);
    await harness.fixture.whenStable();

    expect(adminApi.obtenerUsuarioPorId).toHaveBeenCalledWith(15);
    expect(harness.routeNativeElement?.textContent).toContain('Cuenta activa y verificada');

    pagina.cambiarEstadoUsuario();
    await harness.fixture.whenStable();

    expect(adminApi.desactivarUsuario).toHaveBeenCalledWith(15);
    expect(pagina.usuario()?.estado).toBe(false);
    expect(pagina.mensajeEstadoUsuario()).toContain('desactivada');
  });

  it('carga el vendedor indicado por la ruta', async () => {
    const pagina = await harness.navigateByUrl('/vendedores/7', PaginaAdminDetalle);
    await harness.fixture.whenStable();

    expect(adminApi.obtenerVendedorPorId).toHaveBeenCalledWith(7);
    expect(pagina.vendedor()?.nombreCompleto).toBe('María Cliente');
    expect(harness.routeNativeElement?.textContent).toContain('Perfil habilitado y verificado');
    expect(harness.routeNativeElement?.textContent).toContain('Ver tiendas');
    expect(harness.routeNativeElement?.querySelector('a[href^="mailto:"]')).toBeNull();
  });

  it('carga la tienda indicada por la ruta', async () => {
    const pagina = await harness.navigateByUrl('/tiendas/9', PaginaAdminDetalle);
    await harness.fixture.whenStable();

    expect(adminApi.obtenerTiendaPorId).toHaveBeenCalledWith(9);
    expect(adminApi.obtenerCatalogoPublicoTienda).toHaveBeenCalledWith(9);
    expect(pagina.tienda()?.numeroDocumentoFiscal).toBe('20123456789');
    expect(harness.routeNativeElement?.textContent).toContain('Caja personalizada');
  });

  it('confirma la observación y actualiza el detalle de la tienda', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const pagina = await harness.navigateByUrl('/tiendas/9', PaginaAdminDetalle);
    await harness.fixture.whenStable();

    pagina.moderarTienda('observar');
    await harness.fixture.whenStable();

    expect(adminApi.observarTienda).toHaveBeenCalledWith(9);
    expect(pagina.tienda()?.estadoRevision).toBe('OBSERVADA');
    expect(pagina.mensajeModeracionTienda()).toContain('ahora está observada');
  });

  it('presenta los productos del pedido indicado por la ruta', async () => {
    const pagina = await harness.navigateByUrl('/pedidos/21', PaginaAdminDetalle);
    await harness.fixture.whenStable();

    expect(adminApi.obtenerPedidoPorId).toHaveBeenCalledWith(21);
    expect(pagina.pedido()?.productos).toHaveLength(1);
    expect(harness.routeNativeElement?.textContent).toContain('Caja personalizada');
    expect(harness.routeNativeElement?.textContent).toContain('Progreso del pedido');
    expect(
      harness.routeNativeElement?.querySelectorAll('.detalle-admin__timeline li'),
    ).toHaveLength(4);
  });
});

function crearUsuario() {
  return {
    idUsuario: 15,
    nombreCompleto: 'María Cliente',
    correo: 'maria@regalia.pe',
    telefono: '999888777',
    correoVerificado: true,
    estado: true,
    fechaCreacion: '2026-07-01T10:00:00',
    fechaActualizacion: '2026-07-20T11:00:00',
  };
}

function crearVendedor() {
  return {
    idVendedor: 7,
    idUsuario: 15,
    nombreCompleto: 'María Cliente',
    correo: 'maria@regalia.pe',
    verificado: true,
    tiendasActivas: 2,
    tiendasTotales: 3,
    estado: true,
    fechaCreacion: '2026-07-01T10:00:00',
    fechaActualizacion: '2026-07-20T11:00:00',
  };
}

function crearTienda() {
  return {
    idTienda: 9,
    idVendedor: 7,
    idUsuario: 15,
    nombre: 'Detalles REGALIA',
    descripcion: 'Regalos personalizados',
    direccionReferencia: 'Centro de Trujillo',
    vendedor: 'María Cliente',
    correoVendedor: 'maria@regalia.pe',
    estadoRevision: 'APROBADA',
    formalizada: true,
    idDocumentoFiscal: 22,
    numeroDocumentoFiscal: '20123456789',
    rubros: ['Detalles personalizados'],
    estado: true,
    fechaCreacion: '2026-07-01T10:00:00',
    fechaActualizacion: '2026-07-20T11:00:00',
  };
}

function crearPedido() {
  return {
    idPedido: 21,
    idUsuario: 15,
    idTienda: 9,
    nombreTienda: 'Detalles REGALIA',
    tipoEntrega: 'Recojo en tienda',
    fechaEntrega: '2026-07-25',
    observacion: 'Preparar por la tarde',
    estadoPedido: 'CONFIRMADO',
    subtotal: 120,
    total: 120,
    montoPagado: 60,
    saldoPendiente: 60,
    cantidadItems: 2,
    productos: [
      {
        idDetallePedido: 30,
        idProducto: 12,
        nombre: 'Caja personalizada',
        cantidad: 2,
        precioUnitario: 60,
        subtotal: 120,
      },
    ],
    estado: true,
    fechaCreacion: '2026-07-20T10:00:00',
    fechaActualizacion: null,
  };
}
