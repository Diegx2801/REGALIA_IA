import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, interval } from 'rxjs';

import {
  RolUsuario,
  SesionAutenticacion,
} from '../../../../core/autenticacion/sesion-autenticacion.model';
import { SesionAutenticacionService } from '../../../../core/autenticacion/sesion-autenticacion.service';
import { normalizarErrorApi } from '../../../../core/http/modelos/error-api.model';
import { AutenticacionApiService } from '../../acceso-datos/autenticacion-api.service';
import { CredencialesLogin, ResultadoLogin } from '../../modelos/autenticacion.model';

@Component({
  selector: 'app-pagina-admin-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './pagina-admin-login.html',
  styleUrl: './pagina-admin-login.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaAdminLogin implements OnInit {
  private readonly autenticacionApi = inject(AutenticacionApiService);
  private readonly sesionAutenticacion = inject(SesionAutenticacionService);
  private readonly router = inject(Router);
  private readonly rutaActiva = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private rutaRetorno = '/admin';

  readonly estaEnviando = signal(false);
  readonly mensajeError = signal('');
  readonly mostrarContrasena = signal(false);
  readonly intentosRestantes = signal<number | null>(null);
  private readonly bloqueadoHasta = signal<number | null>(null);
  private readonly relojBloqueo = signal(0);
  readonly segundosBloqueo = computed(() => {
    this.relojBloqueo();
    const hasta = this.bloqueadoHasta();
    return hasta === null ? 0 : Math.max(Math.ceil((hasta - Date.now()) / 1000), 0);
  });
  readonly mensajeBloqueo = computed(() => {
    const segundos = this.segundosBloqueo();
    return segundos > 0
      ? `Acceso bloqueado temporalmente. Intenta nuevamente en ${this.formatearTiempo(segundos)}.`
      : '';
  });
  readonly mensajeIntentos = computed(() => {
    const restantes = this.intentosRestantes();
    if (restantes === null || restantes <= 0 || this.segundosBloqueo() > 0) return '';
    return restantes === 1
      ? 'Te queda 1 intento antes del bloqueo temporal.'
      : `Te quedan ${restantes} intentos antes del bloqueo temporal.`;
  });
  readonly estaBloqueado = computed(() => this.estaEnviando() || this.segundosBloqueo() > 0);

  readonly formularioLogin = new FormGroup({
    correo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    contrasena: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    recordarSesion: new FormControl(false, { nonNullable: true }),
  });

  ngOnInit(): void {
    this.rutaActiva.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((parametros) => {
        const retorno = parametros.get('retorno');
        this.rutaRetorno = this.esRetornoAdministrativoSeguro(retorno) ? retorno : '/admin';
        if (parametros.get('motivo') === 'sesion-expirada') {
          this.mensajeError.set('Tu sesión expiró. Inicia sesión nuevamente para continuar.');
        }
      });

    interval(1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.relojBloqueo.update((valor) => valor + 1));
  }

  alternarContrasena(): void {
    this.mostrarContrasena.update((valor) => !valor);
  }

  campoTieneError(nombreCampo: 'correo' | 'contrasena'): boolean {
    const campo = this.formularioLogin.controls[nombreCampo];
    return campo.invalid && (campo.touched || campo.dirty);
  }

  enviarLogin(): void {
    this.mensajeError.set('');

    if (this.estaBloqueado()) return;

    if (this.formularioLogin.invalid) {
      this.formularioLogin.markAllAsTouched();
      this.mensajeError.set('Ingresa tu correo administrativo y contraseña.');
      return;
    }

    this.estaEnviando.set(true);

    this.autenticacionApi
      .iniciarSesionAdministracion(this.obtenerCredenciales())
      .pipe(finalize(() => this.estaEnviando.set(false)))
      .subscribe({
        next: (resultado) => this.procesarLoginExitoso(resultado),
        error: (error: unknown) => this.mostrarErrorLogin(error),
      });
  }

  private obtenerCredenciales(): CredencialesLogin {
    const valor = this.formularioLogin.getRawValue();

    return {
      correo: valor.correo.trim().toLowerCase(),
      contrasena: valor.contrasena,
    };
  }

  private procesarLoginExitoso(resultado: ResultadoLogin): void {
    this.limpiarEstadoIntentos();
    const rolPrincipal = this.obtenerRolPrincipal(resultado.roles);

    if (rolPrincipal !== 'ADMIN') {
      this.mensajeError.set('Esta cuenta no tiene acceso administrativo.');
      return;
    }

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

    this.sesionAutenticacion.iniciarSesion(
      sesion,
      this.formularioLogin.controls.recordarSesion.value,
    );
    void this.router.navigateByUrl(this.rutaRetorno);
  }

  private esRetornoAdministrativoSeguro(retorno: string | null): retorno is string {
    return Boolean(retorno?.startsWith('/admin') && !retorno.startsWith('//'));
  }

  private obtenerRolPrincipal(roles: RolUsuario[]): RolUsuario {
    return roles.includes('ADMIN') ? 'ADMIN' : (roles[0] ?? 'CLIENTE');
  }

  private mostrarErrorLogin(error: unknown): void {
    const errorNormalizado = normalizarErrorApi(error);
    this.aplicarEstadoIntentos(errorNormalizado.datos);

    if (errorNormalizado.tipo === 'limite') {
      this.mensajeError.set(
        this.segundosBloqueo() > 0
          ? ''
          : errorNormalizado.message ||
              'Acceso bloqueado temporalmente. Intenta nuevamente más tarde.',
      );
      return;
    }

    if (this.segundosBloqueo() > 0) {
      this.mensajeError.set('');
      return;
    }

    this.mensajeError.set(
      errorNormalizado.estado === 401
        ? 'Correo o contraseña administrativos incorrectos.'
        : errorNormalizado.message ||
            'No pudimos iniciar sesión administrativa. Inténtalo nuevamente.',
    );
  }

  private aplicarEstadoIntentos(datos: unknown): void {
    if (!datos || typeof datos !== 'object') return;

    const respuesta = datos as Record<string, unknown>;
    const restantes = Number(respuesta['intentosRestantes']);
    if (!Number.isFinite(restantes)) return;

    this.intentosRestantes.set(Math.max(Math.trunc(restantes), 0));
    const reintentarEnSegundos = Number(respuesta['reintentarEnSegundos']);
    const bloqueadoHasta =
      typeof respuesta['bloqueadoHasta'] === 'string'
        ? Date.parse(respuesta['bloqueadoHasta'])
        : Number.NaN;
    const segundos = Number.isFinite(reintentarEnSegundos)
      ? Math.max(Math.ceil(reintentarEnSegundos), 0)
      : Number.isFinite(bloqueadoHasta)
        ? Math.max(Math.ceil((bloqueadoHasta - Date.now()) / 1000), 0)
        : 0;

    this.bloqueadoHasta.set(segundos > 0 ? Date.now() + segundos * 1000 : null);
    this.relojBloqueo.update((valor) => valor + 1);
  }

  private limpiarEstadoIntentos(): void {
    this.intentosRestantes.set(null);
    this.bloqueadoHasta.set(null);
    this.relojBloqueo.update((valor) => valor + 1);
  }

  private formatearTiempo(segundosTotales: number): string {
    const minutos = Math.floor(segundosTotales / 60);
    const segundos = segundosTotales % 60;
    return `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
  }
}
