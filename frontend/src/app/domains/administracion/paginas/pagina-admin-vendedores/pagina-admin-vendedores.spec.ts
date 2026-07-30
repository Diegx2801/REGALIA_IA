import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { PanelAdministracionApiService } from '../../acceso-datos/panel-administracion-api.service';
import { VendedorAdministracion } from '../../modelos/panel-administracion.model';
import { PaginaAdminVendedores } from './pagina-admin-vendedores';

describe('PaginaAdminVendedores', () => {
  let fixture: ComponentFixture<PaginaAdminVendedores>;
  let adminApi: { obtenerVendedores: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    adminApi = {
      obtenerVendedores: vi.fn(() => of(crearPagina([crearVendedor()]))),
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: PanelAdministracionApiService, useValue: adminApi },
      ],
    });

    fixture = TestBed.createComponent(PaginaAdminVendedores);
  });

  it('consulta inicialmente el directorio con filtros neutrales', async () => {
    await fixture.whenStable();

    expect(adminApi.obtenerVendedores).toHaveBeenCalledWith({
      page: 0,
      size: 20,
      estado: 'TODOS',
      verificacion: 'TODOS',
      searchField: 'nombre',
      search: '',
      sort: 'fechaCreacion,desc',
    });
    expect(fixture.componentInstance.totalVendedores()).toBe(1);
  });

  it('envía filtros, búsqueda, orden y tamaño respaldados por el backend', async () => {
    await fixture.whenStable();
    fixture.componentInstance.formularioFiltros.setValue({
      estado: 'ACTIVO',
      verificacion: 'SIN_VERIFICAR',
      campoBusqueda: 'correo',
      busqueda: '  vendedor@regalia.pe  ',
      orden: 'correo,asc',
    });

    fixture.componentInstance.aplicarFiltros();
    await fixture.whenStable();

    expect(adminApi.obtenerVendedores).toHaveBeenLastCalledWith({
      page: 0,
      size: 20,
      estado: 'ACTIVO',
      verificacion: 'SIN_VERIFICAR',
      searchField: 'correo',
      search: '  vendedor@regalia.pe  ',
      sort: 'correo,asc',
    });
  });

  it('presenta tabla accesible y tarjeta móvil con acciones de detalle', async () => {
    await fixture.whenStable();

    const pagina = fixture.nativeElement as HTMLElement;
    const tabla = pagina.querySelector('table');
    const tarjeta = pagina.querySelector('article.admin-vendedores__tarjeta');

    expect(tabla?.querySelector('caption')?.textContent).toContain('Vendedores según');
    expect(tabla?.querySelectorAll('thead th')).toHaveLength(6);
    expect(tarjeta?.textContent).toContain('María Cliente');
    expect(tarjeta?.querySelector('a[aria-label="Revisar perfil de María Cliente"]')).not.toBeNull();
  });
});

function crearVendedor(): VendedorAdministracion {
  return {
    idVendedor: 7,
    idUsuario: 15,
    nombreCompleto: 'María Cliente',
    correo: 'vendedor@regalia.pe',
    verificado: false,
    tiendasActivas: 2,
    tiendasTotales: 3,
    estado: true,
    fechaCreacion: '2026-07-01T10:00:00',
    fechaActualizacion: '2026-07-20T11:00:00',
  };
}

function crearPagina(contenido: VendedorAdministracion[]) {
  return {
    contenido,
    paginaActual: 0,
    totalElementos: contenido.length,
    totalPaginas: contenido.length > 0 ? 1 : 0,
    ultimaPagina: true,
  };
}
