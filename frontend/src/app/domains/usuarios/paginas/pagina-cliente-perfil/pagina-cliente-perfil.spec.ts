import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { SesionAutenticacionService } from '../../../../core/autenticacion/sesion-autenticacion.service';
import { ClientePanelStore } from '../../estado/cliente-panel.store';
import { UsuarioApiService } from '../../acceso-datos/usuario-api.service';
import { PanelDocumentosUsuario } from '../../componentes/panel-documentos-usuario/panel-documentos-usuario';
import { UsuarioPerfil } from '../../modelos/usuario.model';
import { PaginaClientePerfil } from './pagina-cliente-perfil';

@Component({ selector: 'app-panel-documentos-usuario', template: '<div>Panel de documentos</div>' })
class PanelDocumentosUsuarioStub {}

describe('PaginaClientePerfil', () => {
  let fixture: ComponentFixture<PaginaClientePerfil>;
  let pagina: PaginaClientePerfil;
  let store: ReturnType<typeof crearStore>;
  let usuarioApi: { cambiarContrasena: ReturnType<typeof vi.fn> };
  let sesion: { cerrarSesion: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    store = crearStore();
    usuarioApi = { cambiarContrasena: vi.fn(() => of('Contraseña actualizada.')) };
    sesion = { cerrarSesion: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        { provide: ClientePanelStore, useValue: store },
        { provide: UsuarioApiService, useValue: usuarioApi },
        { provide: SesionAutenticacionService, useValue: sesion },
        provideRouter([]),
      ],
    });

    TestBed.overrideComponent(PaginaClientePerfil, {
      remove: { imports: [PanelDocumentosUsuario] },
      add: { imports: [PanelDocumentosUsuarioStub] },
    });

    fixture = TestBed.createComponent(PaginaClientePerfil);
    pagina = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('presenta el resumen, los datos personales y los métodos de acceso reales', () => {
    const texto = textoPagina();

    expect(store.cargarPanel).toHaveBeenCalledOnce();
    expect(texto).toContain('Diego Regalia');
    expect(texto).toContain('diego@regalia.pe');
    expect(texto).toContain('Correo y contraseña');
    expect(texto).toContain('Google');
    expect(texto).toContain('2');
    expect(pagina.iniciales()).toBe('DR');
  });

  it('guarda datos normalizados y anuncia validaciones por campo', async () => {
    pagina.formularioPerfil.controls.nombres.setValue('  ');
    pagina.guardarPerfil();
    await fixture.whenStable();

    expect(store.guardarPerfil).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('#nombres-error')).not.toBeNull();

    pagina.formularioPerfil.setValue({
      nombres: '  Diego ',
      apellidos: ' Regalia  ',
      telefono: ' 999888777 ',
    });
    pagina.guardarPerfil();

    expect(store.guardarPerfil).toHaveBeenCalledWith({
      nombres: 'Diego',
      apellidos: 'Regalia',
      telefono: '999888777',
    });
  });

  it('permite mostrar y ocultar las contraseñas con estado accesible', async () => {
    const boton = fixture.nativeElement.querySelector(
      '[aria-label="Mostrar contraseña actual"]',
    ) as HTMLButtonElement;

    boton.click();
    await fixture.whenStable();

    const entrada = fixture.nativeElement.querySelector(
      '[formcontrolname="contrasenaActual"]',
    ) as HTMLInputElement;
    expect(entrada.type).toBe('text');
    expect(boton.getAttribute('aria-pressed')).toBe('true');
  });

  it('impide enviar contraseñas diferentes y muestra el error junto al campo', async () => {
    pagina.formularioContrasena.setValue({
      contrasenaActual: 'Regalia123!',
      nuevaContrasena: 'NuevaClave123!',
      confirmarContrasena: 'OtraClave123!',
    });

    pagina.cambiarContrasena();
    await fixture.whenStable();

    expect(usuarioApi.cambiarContrasena).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('#confirmar-contrasena-error')?.textContent).toContain(
      'deben coincidir',
    );
  });

  it('cierra la sesión después de actualizar correctamente la contraseña', async () => {
    const router = TestBed.inject(Router);
    const navegar = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    pagina.formularioContrasena.setValue({
      contrasenaActual: 'Regalia123!',
      nuevaContrasena: 'NuevaClave123!',
      confirmarContrasena: 'NuevaClave123!',
    });

    pagina.cambiarContrasena();
    await fixture.whenStable();

    expect(usuarioApi.cambiarContrasena).toHaveBeenCalledWith({
      contrasenaActual: 'Regalia123!',
      nuevaContrasena: 'NuevaClave123!',
    });
    expect(sesion.cerrarSesion).toHaveBeenCalledOnce();
    expect(navegar).toHaveBeenCalledWith(['/login'], {
      queryParams: { contrasenaActualizada: 'true' },
    });
  });

  it('conserva la sesión y anuncia el error si la contraseña actual es incorrecta', async () => {
    usuarioApi.cambiarContrasena.mockReturnValue(
      throwError(() => new Error('La contraseña actual es incorrecta.')),
    );
    pagina.formularioContrasena.setValue({
      contrasenaActual: 'Incorrecta123!',
      nuevaContrasena: 'NuevaClave123!',
      confirmarContrasena: 'NuevaClave123!',
    });

    pagina.cambiarContrasena();
    await fixture.whenStable();

    expect(sesion.cerrarSesion).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'incorrecta',
    );
  });

  function textoPagina(): string {
    return fixture.nativeElement.textContent.replace(/\s+/g, ' ').trim();
  }
});

function crearStore() {
  const perfil = signal<UsuarioPerfil | null>({
    idUsuario: 7,
    nombres: 'Diego',
    apellidos: 'Regalia',
    nombreCompleto: 'Diego Regalia',
    correo: 'diego@regalia.pe',
    telefono: '999888777',
    correoVerificado: true,
    estado: true,
    fechaCreacion: '2025-04-15T10:00:00',
    fechaActualizacion: '2026-07-20T10:00:00',
  });
  const identidadGoogle = signal({
    proveedor: 'GOOGLE',
    correo: 'diego@regalia.pe',
    correoVerificado: true,
    vinculada: true,
    fechaVinculacion: '2026-01-01T10:00:00',
  });

  return {
    perfil,
    identidadGoogle,
    googleVinculado: signal(true),
    cargando: signal(false),
    guardandoPerfil: signal(false),
    vinculandoGoogle: signal(false),
    reenviandoVerificacion: signal(false),
    refrescandoPerfil: signal(false),
    mensajeError: signal<string | null>(null),
    mensajeExito: signal<string | null>(null),
    cargarPanel: vi.fn(),
    limpiarMensajes: vi.fn(),
    guardarPerfil: vi.fn(),
    vincularGoogle: vi.fn(),
    registrarErrorCuenta: vi.fn(),
    reenviarVerificacionCorreo: vi.fn(),
    refrescarPerfil: vi.fn(),
  };
}
