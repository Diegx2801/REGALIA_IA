import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { PanelAdministracionApiService } from '../../acceso-datos/panel-administracion-api.service';
import { UsuarioAdministracion } from '../../modelos/panel-administracion.model';
import { PaginaAdminUsuarios } from './pagina-admin-usuarios';

describe('PaginaAdminUsuarios', () => {
  let fixture: ComponentFixture<PaginaAdminUsuarios>;
  let adminApi: {
    obtenerUsuarios: ReturnType<typeof vi.fn>;
    desactivarUsuario: ReturnType<typeof vi.fn>;
    reactivarUsuario: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    adminApi = {
      obtenerUsuarios: vi.fn(() => of(crearPagina([crearUsuario(true)]))),
      desactivarUsuario: vi.fn(() => of(crearUsuario(false))),
      reactivarUsuario: vi.fn(() => of(crearUsuario(true))),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: PanelAdministracionApiService, useValue: adminApi },
        provideRouter([]),
      ],
    });

    fixture = TestBed.createComponent(PaginaAdminUsuarios);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('confirma, desactiva y actualiza la lista administrativa', async () => {
    adminApi.obtenerUsuarios
      .mockReturnValueOnce(of(crearPagina([crearUsuario(true)])))
      .mockReturnValueOnce(of(crearPagina([])));
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    await fixture.whenStable();

    const pagina = fixture.nativeElement as HTMLElement;
    const boton = pagina.querySelector<HTMLButtonElement>(
      'button[aria-label="Desactivar cuenta de María Cliente"]',
    );
    boton?.click();
    await fixture.whenStable();

    expect(boton).not.toBeNull();
    expect(adminApi.desactivarUsuario).toHaveBeenCalledWith(15);
    expect(fixture.componentInstance.usuarios()).toEqual([]);
    expect(fixture.componentInstance.mensajeExito()).toBe(
      'La cuenta de María Cliente fue desactivada.',
    );
  });

  it('no modifica la cuenta cuando se cancela la confirmación', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    await fixture.whenStable();

    const pagina = fixture.nativeElement as HTMLElement;
    const boton = pagina.querySelector<HTMLButtonElement>(
      'button[aria-label="Desactivar cuenta de María Cliente"]',
    );
    boton?.click();
    await fixture.whenStable();

    expect(adminApi.desactivarUsuario).not.toHaveBeenCalled();
    expect(fixture.componentInstance.usuarios()).toHaveLength(1);
  });

  it('envía al backend los filtros, orden y paginación elegidos', async () => {
    await fixture.whenStable();

    fixture.componentInstance.formularioFiltros.setValue({
      estado: 'TODOS',
      campoBusqueda: 'nombre',
      busqueda: '  María  ',
      orden: 'nombre,asc',
    });
    fixture.componentInstance.aplicarFiltros();
    await fixture.whenStable();

    expect(adminApi.obtenerUsuarios).toHaveBeenLastCalledWith({
      page: 0,
      size: 20,
      estado: 'TODOS',
      searchField: 'nombre',
      search: '  María  ',
      sort: 'nombre,asc',
    });
  });

  it('renderiza una tabla accesible y una tarjeta móvil con el estado real', async () => {
    await fixture.whenStable();

    const pagina = fixture.nativeElement as HTMLElement;
    const tabla = pagina.querySelector('table');
    const tarjeta = pagina.querySelector('article.admin-usuarios__tarjeta');

    expect(tabla?.querySelector('caption')?.textContent).toContain('Usuarios gestionables');
    expect(tabla?.querySelectorAll('thead th')).toHaveLength(6);
    expect(tabla?.querySelector('a[href="/admin/usuarios/15"]')).not.toBeNull();
    expect(tarjeta?.textContent).toContain('Correo verificado');
    expect(tarjeta?.textContent).toContain('Activa');
    expect(tarjeta?.querySelector('a[href="/admin/usuarios/15"]')).not.toBeNull();
  });
});

function crearUsuario(estado: boolean): UsuarioAdministracion {
  return {
    idUsuario: 15,
    nombreCompleto: 'María Cliente',
    correo: 'maria@regalia.pe',
    telefono: '999888777',
    correoVerificado: true,
    estado,
    fechaCreacion: '2026-07-20T10:00:00',
    fechaActualizacion: '2026-07-20T11:00:00',
  };
}

function crearPagina(contenido: UsuarioAdministracion[]) {
  return {
    contenido,
    paginaActual: 0,
    totalElementos: contenido.length,
    totalPaginas: contenido.length > 0 ? 1 : 0,
    ultimaPagina: true,
  };
}
