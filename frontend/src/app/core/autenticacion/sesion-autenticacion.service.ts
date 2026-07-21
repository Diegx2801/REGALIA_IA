import { computed, inject, Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { AlmacenamientoAutenticacionService } from './almacenamiento-autenticacion.service';
import {
  CambioIdentidadSesion,
  MotivoCambioSesion,
  RolUsuario,
  SesionAutenticacion,
  UsuarioSesion,
} from './sesion-autenticacion.model';
import { GoogleIdentidadService } from '../../domains/autenticacion/acceso-datos/google-identidad.service';

@Injectable({ providedIn: 'root' })
export class SesionAutenticacionService {
  private static readonly RETARDO_MAXIMO_TEMPORIZADOR = 2_147_000_000;
  private readonly almacenamiento = inject(AlmacenamientoAutenticacionService);
  private readonly googleIdentidad = inject(GoogleIdentidadService);
  private readonly cambiosIdentidad = new Subject<CambioIdentidadSesion>();
  private readonly sesionActual = signal<SesionAutenticacion | null>(
    this.almacenamiento.obtenerSesion(),
  );
  private temporizadorExpiracion: ReturnType<typeof setTimeout> | null = null;

  readonly usuarioActual = computed(() => this.sesionActual()?.usuario ?? null);
  readonly tokenActual = computed(() => this.sesionActual()?.token ?? null);
  readonly estaAutenticado = computed(() => Boolean(this.tokenActual()));
  readonly rolActual = computed<RolUsuario | null>(() => this.usuarioActual()?.rol ?? null);
  readonly cambiosIdentidad$ = this.cambiosIdentidad.asObservable();
  readonly rolesActuales = computed<RolUsuario[]>(() => {
    const usuario = this.usuarioActual();
    if (!usuario) return [];

    // Mantiene compatibles las sesiones locales emitidas antes de guardar todos los roles.
    return usuario.roles?.length ? usuario.roles : [usuario.rol];
  });

  constructor() {
    this.programarExpiracion(this.sesionActual());
  }

  // Punto unico para actualizar sesion despues de login o refresh token futuro.
  iniciarSesion(sesion: SesionAutenticacion, recordar: boolean): void {
    this.almacenamiento.guardarSesion(sesion, recordar);
    this.aplicarSesion(sesion, 'inicio');
  }

  /** Reemplaza la sesion sin alterar la preferencia de persistencia elegida. */
  reemplazarSesion(sesion: SesionAutenticacion): void {
    this.almacenamiento.actualizarSesion(sesion);
    this.aplicarSesion(sesion, 'reemplazo');
  }

  actualizarUsuarioActual(cambios: Partial<UsuarioSesion>): void {
    const sesion = this.sesionActual();
    if (!sesion) return;

    const sesionActualizada: SesionAutenticacion = {
      ...sesion,
      usuario: {
        ...sesion.usuario,
        ...cambios,
      },
    };

    this.almacenamiento.actualizarSesion(sesionActualizada);
    this.aplicarSesion(sesionActualizada, 'reemplazo');
  }

  cerrarSesion(): void {
    this.cerrarSesionConMotivo('cierre');
  }

  cerrarSesionExpirada(): void {
    this.cerrarSesionConMotivo('expiracion');
  }

  tieneRol(rolesPermitidos: RolUsuario[]): boolean {
    return this.rolesActuales().some((rol) => rolesPermitidos.includes(rol));
  }

  private cerrarSesionConMotivo(motivo: 'cierre' | 'expiracion'): void {
    this.almacenamiento.limpiarSesion();
    this.googleIdentidad.limpiarSeleccionAutomatica();
    this.aplicarSesion(null, motivo);
  }

  private aplicarSesion(sesion: SesionAutenticacion | null, motivo: MotivoCambioSesion): void {
    const idUsuarioAnterior = this.sesionActual()?.usuario.idUsuario ?? null;
    const idUsuarioActual = sesion?.usuario.idUsuario ?? null;

    this.sesionActual.set(sesion);
    this.programarExpiracion(sesion);

    if (idUsuarioAnterior !== idUsuarioActual) {
      this.cambiosIdentidad.next({ idUsuarioAnterior, idUsuarioActual, motivo });
    }
  }

  private programarExpiracion(sesion: SesionAutenticacion | null): void {
    if (this.temporizadorExpiracion !== null) {
      clearTimeout(this.temporizadorExpiracion);
      this.temporizadorExpiracion = null;
    }

    if (!sesion?.expiraEn) return;

    const tiempoRestante = sesion.expiraEn - Date.now();
    if (tiempoRestante <= 0) {
      queueMicrotask(() => this.cerrarSesionExpirada());
      return;
    }

    this.temporizadorExpiracion = setTimeout(
      () => {
        const sesionActual = this.sesionActual();
        if (sesionActual && Date.now() < sesionActual.expiraEn) {
          this.programarExpiracion(sesionActual);
          return;
        }
        this.cerrarSesionExpirada();
      },
      Math.min(tiempoRestante, SesionAutenticacionService.RETARDO_MAXIMO_TEMPORIZADOR),
    );
  }
}
