import { ComponentFixture, TestBed } from '@angular/core/testing';
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
      providers: [{ provide: PanelAdministracionApiService, useValue: adminApi }],
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
    expect(fixture.componentInstance.mensajeExito()).toBe('Usuario desactivado correctamente.');
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
});

function crearUsuario(estado: boolean): UsuarioAdministracion {
  return {
    idUsuario: 15,
    nombreCompleto: 'María Cliente',
    correo: 'maria@regalia.pe',
    telefono: '999888777',
    estado,
    fechaCreacion: '2026-07-20T10:00:00',
  };
}

function crearPagina(contenido: UsuarioAdministracion[]) {
  return {
    contenido,
    paginaActual: 0,
    tamanioPagina: 12,
    totalElementos: contenido.length,
    totalPaginas: contenido.length > 0 ? 1 : 0,
    ultimaPagina: true,
  };
}
