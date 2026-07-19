import { computed, inject, Injectable, signal } from '@angular/core';
import { AlmacenamientoAutenticacionService } from './almacenamiento-autenticacion.service';
import { RolUsuario, SesionAutenticacion, UsuarioSesion } from './sesion-autenticacion.model';
import { GoogleIdentidadService } from '../../domains/autenticacion/acceso-datos/google-identidad.service';

@Injectable({ providedIn: 'root' })
export class SesionAutenticacionService {
  private readonly almacenamiento = inject(AlmacenamientoAutenticacionService);
  private readonly googleIdentidad = inject(GoogleIdentidadService);
  private readonly sesionActual = signal<SesionAutenticacion | null>(
    this.almacenamiento.obtenerSesion(),
  );

  readonly usuarioActual = computed(() => this.sesionActual()?.usuario ?? null);
  readonly tokenActual = computed(() => this.sesionActual()?.token ?? null);
  readonly estaAutenticado = computed(() => Boolean(this.tokenActual()));
  readonly rolActual = computed<RolUsuario | null>(() => this.usuarioActual()?.rol ?? null);
  readonly rolesActuales = computed<RolUsuario[]>(() => {
    const usuario = this.usuarioActual();
    if (!usuario) return [];

    // Mantiene compatibles las sesiones locales emitidas antes de guardar todos los roles.
    return usuario.roles?.length ? usuario.roles : [usuario.rol];
  });

  // Punto unico para actualizar sesion despues de login o refresh token futuro.
  iniciarSesion(sesion: SesionAutenticacion, recordar: boolean): void {
    this.almacenamiento.guardarSesion(sesion, recordar);
    this.sesionActual.set(sesion);
  }

  /** Reemplaza la sesion sin alterar la preferencia de persistencia elegida. */
  reemplazarSesion(sesion: SesionAutenticacion): void {
    this.almacenamiento.actualizarSesion(sesion);
    this.sesionActual.set(sesion);
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
    this.sesionActual.set(sesionActualizada);
  }

  cerrarSesion(): void {
    this.almacenamiento.limpiarSesion();
    this.googleIdentidad.limpiarSeleccionAutomatica();
    this.sesionActual.set(null);
  }

  tieneRol(rolesPermitidos: RolUsuario[]): boolean {
    return this.rolesActuales().some((rol) => rolesPermitidos.includes(rol));
  }
}
