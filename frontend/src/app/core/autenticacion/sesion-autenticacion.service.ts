import { computed, inject, Injectable, signal } from '@angular/core';
import { AlmacenamientoAutenticacionService } from './almacenamiento-autenticacion.service';
import { RolUsuario, SesionAutenticacion } from './sesion-autenticacion.model';
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

  // Punto unico para actualizar sesion despues de login o refresh token futuro.
  iniciarSesion(sesion: SesionAutenticacion, recordar: boolean): void {
    this.almacenamiento.guardarSesion(sesion, recordar);
    this.sesionActual.set(sesion);
  }

  cerrarSesion(): void {
    this.almacenamiento.limpiarSesion();
    this.googleIdentidad.limpiarSeleccionAutomatica();
    this.sesionActual.set(null);
  }

  tieneRol(rolesPermitidos: RolUsuario[]): boolean {
    const rol = this.rolActual();
    return rol !== null && rolesPermitidos.includes(rol);
  }
}
