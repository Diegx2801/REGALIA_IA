import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { PanelAdministracionApiService } from '../../acceso-datos/panel-administracion-api.service';
import { TiendaAdministracion } from '../../modelos/panel-administracion.model';
import { PaginaAdminTiendas } from './pagina-admin-tiendas';

describe('PaginaAdminTiendas', () => {
  let fixture: ComponentFixture<PaginaAdminTiendas>;
  let adminApi: {
    obtenerTiendas: ReturnType<typeof vi.fn>;
    aprobarTienda: ReturnType<typeof vi.fn>;
    observarTienda: ReturnType<typeof vi.fn>;
    rechazarTienda: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    adminApi = {
      obtenerTiendas: vi.fn(() => of(crearPagina([crearTienda()]))),
      aprobarTienda: vi.fn(() => of(crearTienda({ estadoRevision: 'APROBADA' }))),
      observarTienda: vi.fn(() => of(crearTienda({ estadoRevision: 'OBSERVADA' }))),
      rechazarTienda: vi.fn(() => of(crearTienda({ estadoRevision: 'RECHAZADA' }))),
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: PanelAdministracionApiService, useValue: adminApi },
      ],
    });
    fixture = TestBed.createComponent(PaginaAdminTiendas);
  });

  afterEach(() => vi.restoreAllMocks());

  it('consulta inicialmente tiendas con filtros neutrales', async () => {
    await fixture.whenStable();

    expect(adminApi.obtenerTiendas).toHaveBeenCalledWith({
      page: 0,
      size: 10,
      estadoRevision: undefined,
      searchField: 'nombre',
      search: '',
      sort: 'fechaCreacion,desc',
    });
    expect(fixture.componentInstance.totalTiendas()).toBe(1);
  });

  it('envía búsqueda, estado, orden y tamaño soportados por el backend', async () => {
    await fixture.whenStable();
    fixture.componentInstance.formularioFiltros.setValue({
      estadoRevision: 'OBSERVADA',
      campoBusqueda: 'correo_vendedor',
      busqueda: '  vendedor@regalia.pe  ',
      orden: 'nombreVendedor,asc',
      tamanioPagina: 20,
    });

    fixture.componentInstance.aplicarFiltros();
    await fixture.whenStable();

    expect(adminApi.obtenerTiendas).toHaveBeenLastCalledWith({
      page: 0,
      size: 20,
      estadoRevision: 'OBSERVADA',
      searchField: 'correo_vendedor',
      search: '  vendedor@regalia.pe  ',
      sort: 'nombreVendedor,asc',
    });
  });

  it('presenta tabla accesible y tarjetas para la vista móvil', async () => {
    await fixture.whenStable();
    const pagina = fixture.nativeElement as HTMLElement;

    expect(pagina.querySelector('table caption')?.textContent).toContain('Tiendas según');
    expect(pagina.querySelectorAll('table thead th')).toHaveLength(6);
    expect(pagina.querySelector('article.admin-tiendas__tarjeta')?.textContent).toContain(
      'Detalles REGALIA',
    );
  });

  it('no rechaza una tienda cuando se cancela la confirmación', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    await fixture.whenStable();

    fixture.componentInstance.rechazarTienda(crearTienda());

    expect(adminApi.rechazarTienda).not.toHaveBeenCalled();
  });

  it('aprueba una tienda, informa el resultado y actualiza la consulta', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    await fixture.whenStable();

    fixture.componentInstance.aprobarTienda(crearTienda());
    await fixture.whenStable();

    expect(adminApi.aprobarTienda).toHaveBeenCalledWith(9);
    expect(adminApi.obtenerTiendas).toHaveBeenCalledTimes(2);
    expect(fixture.componentInstance.mensajeExito()).toContain('ahora está aprobada');
  });
});

function crearTienda(cambios: Partial<TiendaAdministracion> = {}): TiendaAdministracion {
  return {
    idTienda: 9,
    idVendedor: 7,
    idUsuario: 15,
    nombre: 'Detalles REGALIA',
    descripcion: 'Regalos personalizados',
    direccionReferencia: 'Centro de Trujillo',
    vendedor: 'María Cliente',
    correoVendedor: 'vendedor@regalia.pe',
    estadoRevision: 'PENDIENTE',
    formalizada: true,
    idDocumentoFiscal: 22,
    numeroDocumentoFiscal: '20123456789',
    rubros: ['Detalles personalizados'],
    estado: true,
    fechaCreacion: '2026-07-01T10:00:00',
    fechaActualizacion: '2026-07-20T11:00:00',
    ...cambios,
  };
}

function crearPagina(contenido: TiendaAdministracion[]) {
  return {
    contenido,
    paginaActual: 0,
    tamanioPagina: 10,
    totalElementos: contenido.length,
    totalPaginas: contenido.length > 0 ? 1 : 0,
    ultimaPagina: true,
  };
}
