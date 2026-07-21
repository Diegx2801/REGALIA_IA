import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, forkJoin } from 'rxjs';
import { obtenerMensajeErrorUsuario } from '../../../core/http/modelos/error-api.model';
import { CuentaIdentidadApiService } from '../../autenticacion/acceso-datos/cuenta-identidad-api.service';
import { IdentidadCuenta } from '../../autenticacion/modelos/autenticacion.model';
import { UsuarioApiService } from '../acceso-datos/usuario-api.service';
import { SolicitudActualizarPerfilUsuario, UsuarioPerfil } from '../modelos/usuario.model';

@Injectable()
export class ClientePanelStore {
  private readonly usuarioApi = inject(UsuarioApiService);
  private readonly cuentaIdentidadApi = inject(CuentaIdentidadApiService);
  private readonly destroyRef = inject(DestroyRef);
  private panelCargado = false;

  readonly perfil = signal<UsuarioPerfil | null>(null);
  readonly identidadesCuenta = signal<IdentidadCuenta[]>([]);
  readonly cargando = signal(false);
  readonly guardandoPerfil = signal(false);
  readonly vinculandoGoogle = signal(false);
  readonly reenviandoVerificacion = signal(false);
  readonly refrescandoPerfil = signal(false);
  readonly mensajeError = signal<string | null>(null);
  readonly mensajeExito = signal<string | null>(null);

  readonly identidadGoogle = computed(
    () => this.identidadesCuenta().find((identidad) => identidad.proveedor === 'GOOGLE') ?? null,
  );
  readonly googleVinculado = computed(() => Boolean(this.identidadGoogle()?.vinculada));

  cargarPanel(forzar = false): void {
    if (this.panelCargado && !forzar) return;

    this.cargando.set(true);
    this.mensajeError.set(null);
    this.mensajeExito.set(null);

    forkJoin({
      perfil: this.usuarioApi.obtenerPerfilActual(),
      identidades: this.cuentaIdentidadApi.listarIdentidades(),
    })
      .pipe(
        finalize(() => this.cargando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ perfil, identidades }) => {
          this.perfil.set(perfil);
          this.identidadesCuenta.set(identidades);
          this.panelCargado = true;
        },
        error: (error: unknown) => this.mensajeError.set(this.obtenerMensajeError(error)),
      });
  }

  refrescarPerfil(mensajeExito?: string): void {
    this.refrescandoPerfil.set(true);
    this.mensajeError.set(null);
    this.mensajeExito.set(null);

    this.usuarioApi
      .obtenerPerfilActual()
      .pipe(
        finalize(() => this.refrescandoPerfil.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (perfil) => {
          this.perfil.set(perfil);
          if (mensajeExito) {
            this.mensajeExito.set(mensajeExito);
          }
        },
        error: (error: unknown) => this.mensajeError.set(this.obtenerMensajeError(error)),
      });
  }

  guardarPerfil(solicitud: SolicitudActualizarPerfilUsuario): void {
    this.guardandoPerfil.set(true);
    this.mensajeError.set(null);
    this.mensajeExito.set(null);

    // El backend identifica al cliente por el JWT; no se envia idUsuario desde el frontend.
    this.usuarioApi
      .actualizarPerfil(solicitud)
      .pipe(
        finalize(() => this.guardandoPerfil.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (perfil) => {
          this.perfil.set(perfil);
          this.mensajeExito.set('Perfil actualizado correctamente.');
        },
        error: (error: unknown) => this.mensajeError.set(this.obtenerMensajeError(error)),
      });
  }

  vincularGoogle(idToken: string): void {
    this.vinculandoGoogle.set(true);
    this.mensajeError.set(null);
    this.mensajeExito.set(null);

    this.cuentaIdentidadApi
      .vincularGoogle(idToken)
      .pipe(
        finalize(() => this.vinculandoGoogle.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (identidad) => {
          this.identidadesCuenta.update((identidades) => [
            identidad,
            ...identidades.filter((actual) => actual.proveedor !== identidad.proveedor),
          ]);
          this.mensajeExito.set('Google vinculado correctamente.');
        },
        error: (error: unknown) => this.mensajeError.set(this.obtenerMensajeError(error)),
      });
  }

  reenviarVerificacionCorreo(): void {
    this.reenviandoVerificacion.set(true);
    this.mensajeError.set(null);
    this.mensajeExito.set(null);

    this.usuarioApi
      .reenviarVerificacionCorreo()
      .pipe(
        finalize(() => this.reenviandoVerificacion.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (mensaje) => this.refrescarPerfil(mensaje),
        error: (error: unknown) => this.mensajeError.set(this.obtenerMensajeError(error)),
      });
  }

  registrarErrorCuenta(mensaje: string): void {
    this.mensajeError.set(mensaje);
    this.mensajeExito.set(null);
  }

  limpiarMensajes(): void {
    this.mensajeError.set(null);
    this.mensajeExito.set(null);
  }

  private obtenerMensajeError(error: unknown): string {
    return obtenerMensajeErrorUsuario(error, 'No pudimos cargar la informacion del cliente.');
  }
}
