import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ProductoApiService } from '../../catalogo/acceso-datos/producto-api.service';
import { RespuestaPaginada } from '../../../shared/modelos/respuesta-api.model';
import { DatosMaestrosAdminApiService } from '../acceso-datos/datos-maestros-admin-api.service';
import { PanelAdministracionApiService } from '../acceso-datos/panel-administracion-api.service';
import { AdministracionPanelStore } from './administracion-panel.store';

function pagina<T>(contenido: T[], totalElementos = contenido.length): RespuestaPaginada<T> {
  return {
    contenido,
    paginaActual: 0,
    tamanioPagina: contenido.length,
    totalElementos,
    totalPaginas: totalElementos > 0 ? 1 : 0,
    ultimaPagina: true,
  };
}

describe('AdministracionPanelStore', () => {
  const tiendaPendiente = {
    idTienda: 10,
    idVendedor: 4,
    idUsuario: 3,
    nombre: 'Tienda pendiente',
    descripcion: '',
    direccionReferencia: '',
    vendedor: 'Vendedora',
    correoVendedor: 'vendedora@regalia.test',
    estadoRevision: 'PENDIENTE',
    formalizada: false,
    idDocumentoFiscal: null,
    numeroDocumentoFiscal: null,
    rubros: [],
    estado: true,
    fechaCreacion: '2026-07-18T10:00:00Z',
    fechaActualizacion: null,
  };

  let adminApi: {
    obtenerUsuarios: ReturnType<typeof vi.fn>;
    obtenerVendedores: ReturnType<typeof vi.fn>;
    obtenerTiendas: ReturnType<typeof vi.fn>;
    obtenerPedidos: ReturnType<typeof vi.fn>;
  };
  let productoApi: { obtenerProductos: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    adminApi = {
      obtenerUsuarios: vi.fn(() => of(pagina([], 12))),
      obtenerVendedores: vi.fn(() => of(pagina([], 4))),
      obtenerTiendas: vi.fn((consulta: { estadoRevision?: string }) =>
        consulta.estadoRevision === 'PENDIENTE'
          ? of(pagina([tiendaPendiente], 3))
          : of(pagina([tiendaPendiente], 7)),
      ),
      obtenerPedidos: vi.fn((consulta: { estadoPago?: string }) =>
        consulta.estadoPago === 'CON_SALDO' ? of(pagina([], 2)) : of(pagina([], 9)),
      ),
    };
    productoApi = { obtenerProductos: vi.fn(() => of(pagina([], 18))) };

    TestBed.configureTestingModule({
      providers: [
        AdministracionPanelStore,
        { provide: PanelAdministracionApiService, useValue: adminApi },
        { provide: DatosMaestrosAdminApiService, useValue: {} },
        { provide: ProductoApiService, useValue: productoApi },
      ],
    });
  });

  afterEach(() => TestBed.resetTestingModule());

  it('obtiene conteos operativos exactos mediante filtros respaldados por el backend', () => {
    const store = TestBed.inject(AdministracionPanelStore);

    store.cargarResumen();

    expect(adminApi.obtenerTiendas).toHaveBeenCalledWith({ size: 4, estadoRevision: 'PENDIENTE' });
    expect(adminApi.obtenerPedidos).toHaveBeenCalledWith({ size: 1, estadoPago: 'CON_SALDO' });
    expect(store.tiendasPendientes()).toBe(3);
    expect(store.pedidosConSaldo()).toBe(2);
    expect(store.tiendasPendientesResumen()).toEqual([tiendaPendiente]);
    expect(store.totalTiendas()).toBe(7);
    expect(store.totalPedidos()).toBe(9);
    expect(store.totalProductosVisibles()).toBe(18);
    expect(store.ultimaActualizacion()).toBeInstanceOf(Date);
  });

  it('evita recargar un resumen ya sincronizado salvo actualización explícita', () => {
    const store = TestBed.inject(AdministracionPanelStore);

    store.cargarResumen();
    store.cargarResumen();
    store.cargarResumen(true);

    expect(adminApi.obtenerUsuarios).toHaveBeenCalledTimes(2);
    expect(productoApi.obtenerProductos).toHaveBeenCalledTimes(2);
  });
});
