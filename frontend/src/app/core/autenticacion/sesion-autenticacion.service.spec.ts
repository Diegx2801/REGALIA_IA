import { TestBed } from '@angular/core/testing';
import { GoogleIdentidadService } from '../../domains/autenticacion/acceso-datos/google-identidad.service';
import { AlmacenamientoAutenticacionService } from './almacenamiento-autenticacion.service';
import { SesionAutenticacion } from './sesion-autenticacion.model';
import { SesionAutenticacionService } from './sesion-autenticacion.service';

describe('SesionAutenticacionService', () => {
  const almacenamiento = {
    obtenerSesion: vi.fn(() => null),
    guardarSesion: vi.fn(),
    actualizarSesion: vi.fn(),
    limpiarSesion: vi.fn(),
  };
  const google = { limpiarSeleccionAutomatica: vi.fn() };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    almacenamiento.obtenerSesion.mockReturnValue(null);
    TestBed.configureTestingModule({
      providers: [
        { provide: AlmacenamientoAutenticacionService, useValue: almacenamiento },
        { provide: GoogleIdentidadService, useValue: google },
      ],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    TestBed.resetTestingModule();
  });

  it('notifica únicamente cuando cambia la identidad autenticada', () => {
    const servicio = TestBed.inject(SesionAutenticacionService);
    const cambios = vi.fn();
    servicio.cambiosIdentidad$.subscribe(cambios);

    servicio.iniciarSesion(crearSesion(1), false);
    servicio.reemplazarSesion({ ...crearSesion(1), token: 'token-renovado' });
    servicio.iniciarSesion(crearSesion(2), false);

    expect(cambios).toHaveBeenCalledTimes(2);
    expect(cambios).toHaveBeenLastCalledWith({
      idUsuarioAnterior: 1,
      idUsuarioActual: 2,
      motivo: 'inicio',
    });
  });

  it('cierra automáticamente una sesión cuando expira', () => {
    const servicio = TestBed.inject(SesionAutenticacionService);
    servicio.iniciarSesion(crearSesion(1, 1_000), false);

    vi.advanceTimersByTime(1_001);

    expect(servicio.estaAutenticado()).toBe(false);
    expect(almacenamiento.limpiarSesion).toHaveBeenCalledOnce();
  });
});

function crearSesion(idUsuario: number, duracion = 60_000): SesionAutenticacion {
  return {
    token: `token-${idUsuario}`,
    expiraEn: Date.now() + duracion,
    usuario: {
      idUsuario,
      correo: `usuario${idUsuario}@regalia.test`,
      nombreCompleto: `Usuario ${idUsuario}`,
      roles: ['CLIENTE'],
      rol: 'CLIENTE',
      correoVerificado: true,
    },
  };
}
