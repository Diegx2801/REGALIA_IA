import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { PanelAdministracionApiService } from '../../acceso-datos/panel-administracion-api.service';
import { PedidoAdministracion } from '../../modelos/panel-administracion.model';
import { PaginaAdminPedidos } from './pagina-admin-pedidos';

describe('PaginaAdminPedidos', () => {
  let fixture: ComponentFixture<PaginaAdminPedidos>;
  let adminApi: { obtenerPedidos: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    adminApi = { obtenerPedidos: vi.fn(() => of(crearPagina([crearPedido()]))) };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: PanelAdministracionApiService, useValue: adminApi },
      ],
    });
    fixture = TestBed.createComponent(PaginaAdminPedidos);
  });

  it('consulta inicialmente pedidos con filtros neutrales', async () => {
    await fixture.whenStable();

    expect(adminApi.obtenerPedidos).toHaveBeenCalledWith({
      page: 0,
      size: 10,
      estadoPago: undefined,
      estadoPedido: undefined,
      idTienda: undefined,
      searchField: 'id_pedido',
      search: '',
      fechaDesde: undefined,
      fechaHasta: undefined,
      sort: 'fechaCreacion,desc',
    });
    expect(fixture.componentInstance.pedidosConAlerta()).toBe(1);
  });

  it('combina estado, tienda, fechas, búsqueda y orden respaldados por el backend', async () => {
    await fixture.whenStable();
    fixture.componentInstance.formularioFiltros.setValue({
      estadoPago: 'CON_SALDO',
      estadoPedido: 'EN_PREPARACION',
      idTienda: 9,
      campoBusqueda: 'id_usuario',
      busqueda: '  15  ',
      fechaDesde: '2026-07-01',
      fechaHasta: '2026-07-20',
      orden: 'saldoPendiente,desc',
      tamanioPagina: 20,
    });

    fixture.componentInstance.aplicarFiltros();
    await fixture.whenStable();

    expect(adminApi.obtenerPedidos).toHaveBeenLastCalledWith({
      page: 0,
      size: 20,
      estadoPago: 'CON_SALDO',
      estadoPedido: 'EN_PREPARACION',
      idTienda: 9,
      searchField: 'id_usuario',
      search: '  15  ',
      fechaDesde: '2026-07-01',
      fechaHasta: '2026-07-20',
      sort: 'saldoPendiente,desc',
    });
  });

  it('impide consultar cuando el rango de fechas está invertido', async () => {
    await fixture.whenStable();
    fixture.componentInstance.formularioFiltros.patchValue({
      fechaDesde: '2026-07-20',
      fechaHasta: '2026-07-01',
    });

    fixture.componentInstance.aplicarFiltros();
    await fixture.whenStable();

    expect(adminApi.obtenerPedidos).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.mensajeValidacion()).toContain('fecha desde');
  });

  it('presenta tabla accesible y tarjeta móvil con acceso al detalle', async () => {
    await fixture.whenStable();
    const pagina = fixture.nativeElement as HTMLElement;

    expect(pagina.querySelector('table caption')?.textContent).toContain('Pedidos según');
    expect(pagina.querySelectorAll('table thead th')).toHaveLength(7);
    expect(pagina.querySelector('article.admin-pedidos__tarjeta')?.textContent).toContain(
      'Detalles REGALIA',
    );
    expect(pagina.querySelector('a[aria-label="Revisar detalle del pedido 21"]')).not.toBeNull();
  });
});

function crearPedido(): PedidoAdministracion {
  return {
    idPedido: 21,
    idUsuario: 15,
    idTienda: 9,
    nombreTienda: 'Detalles REGALIA',
    tipoEntrega: 'Recojo en tienda',
    fechaEntrega: '2020-07-25',
    observacion: 'Preparar por la tarde',
    estadoPedido: 'EN_PREPARACION',
    subtotal: 120,
    total: 120,
    montoPagado: 60,
    saldoPendiente: 60,
    cantidadItems: 2,
    productos: [],
    estado: true,
    fechaCreacion: '2026-07-20T10:00:00',
    fechaActualizacion: null,
  };
}

function crearPagina(contenido: PedidoAdministracion[]) {
  return {
    contenido,
    paginaActual: 0,
    tamanioPagina: 10,
    totalElementos: contenido.length,
    totalPaginas: contenido.length > 0 ? 1 : 0,
    ultimaPagina: true,
  };
}
