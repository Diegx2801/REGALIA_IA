import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { finalize, switchMap } from 'rxjs';
import { RolUsuario, SesionAutenticacion } from '../../../../../core/autenticacion/sesion-autenticacion.model';
import { SesionAutenticacionService } from '../../../../../core/autenticacion/sesion-autenticacion.service';
import { obtenerMensajeErrorUsuario } from '../../../../../core/http/modelos/error-api.model';
import { AutenticacionApiService } from '../../../../autenticacion/acceso-datos/autenticacion-api.service';
import { ResultadoLogin } from '../../../../autenticacion/modelos/autenticacion.model';
import { VendedorApiService } from '../../../acceso-datos/vendedor-api.service';

@Component({
  selector: 'app-pagina-empezar-a-vender',
  imports: [RouterLink],
  templateUrl: './pagina-empezar-a-vender.html',
  styleUrl: './pagina-empezar-a-vender.css',
})
export class PaginaEmpezarAVender {
  private readonly sesionAutenticacion = inject(SesionAutenticacionService);
  private readonly autenticacionApi = inject(AutenticacionApiService);
  private readonly vendedorApi = inject(VendedorApiService);
  private readonly router = inject(Router);

  readonly sesion = this.sesionAutenticacion;
  readonly procesando = signal(false);
  readonly actualizandoEstado = signal(false);
  readonly mensajeError = signal<string | null>(null);
  readonly mensajeExito = signal<string | null>(null);
  readonly correoVerificado = computed(() => Boolean(this.sesion.usuarioActual()?.correoVerificado));
  readonly yaEsVendedor = computed(() => this.sesion.tieneRol(['VENDEDOR']));

  actualizarEstadoCuenta(): void {
    if (!this.sesion.estaAutenticado() || this.actualizandoEstado()) return;

    this.mensajeError.set(null);
    this.mensajeExito.set(null);
    this.actualizandoEstado.set(true);

    this.autenticacionApi
      .refrescarSesionPublica()
      .pipe(finalize(() => this.actualizandoEstado.set(false)))
      .subscribe({
        next: (resultado) => {
          this.reemplazarSesion(resultado);
          this.mensajeExito.set(
            resultado.correoVerificado
              ? 'Tu correo ya está confirmado. Puedes continuar.'
              : 'Tu correo aún está pendiente de confirmación.',
          );
        },
        error: (error: unknown) =>
          this.mensajeError.set(
            obtenerMensajeErrorUsuario(error, 'No pudimos actualizar el estado de tu cuenta.'),
          ),
      });
  }

  crearPerfilVendedor(): void {
    if (!this.correoVerificado() || this.procesando()) return;

    this.mensajeError.set(null);
    this.mensajeExito.set(null);
    this.procesando.set(true);

    this.vendedorApi
      .crearPerfilVendedor()
      .pipe(
        switchMap(() => this.autenticacionApi.refrescarSesionPublica()),
        finalize(() => this.procesando.set(false)),
      )
      .subscribe({
        next: (resultado) => {
          this.reemplazarSesion(resultado);
          void this.router.navigateByUrl('/vendedor/tiendas');
        },
        error: (error: unknown) =>
          this.mensajeError.set(
            obtenerMensajeErrorUsuario(error, 'No pudimos preparar tu perfil vendedor. Inténtalo nuevamente.'),
          ),
      });
  }

  irAlPanelVendedor(): void {
    void this.router.navigateByUrl('/vendedor');
  }

  private reemplazarSesion(resultado: ResultadoLogin): void {
    const rolPrincipal = this.obtenerRolPrincipal(resultado.roles);
    const sesion: SesionAutenticacion = {
      token: resultado.token,
      expiraEn: Date.now() + resultado.expiraEnMinutos * 60_000,
      usuario: {
        idUsuario: resultado.idUsuario,
        correo: resultado.correo,
        nombreCompleto: resultado.correo,
        roles: resultado.roles,
        rol: rolPrincipal,
        correoVerificado: resultado.correoVerificado,
      },
    };

    this.sesionAutenticacion.reemplazarSesion(sesion);
  }

  private obtenerRolPrincipal(roles: RolUsuario[]): RolUsuario {
    if (roles.includes('ADMIN')) return 'ADMIN';
    if (roles.includes('VENDEDOR')) return 'VENDEDOR';
    return 'CLIENTE';
  }
}
