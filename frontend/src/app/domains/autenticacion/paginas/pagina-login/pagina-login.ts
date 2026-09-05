import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, interval } from 'rxjs';
import {
  RolUsuario,
  SesionAutenticacion,
} from '../../../../core/autenticacion/sesion-autenticacion.model';
import { SesionAutenticacionService } from '../../../../core/autenticacion/sesion-autenticacion.service';
import {
  normalizarErrorApi,
  obtenerMensajeErrorUsuario,
} from '../../../../core/http/modelos/error-api.model';
import { UsuarioApiService } from '../../../usuarios/acceso-datos/usuario-api.service';
import { SolicitudCrearUsuario } from '../../../usuarios/modelos/usuario.model';
import { AutenticacionApiService } from '../../acceso-datos/autenticacion-api.service';
import { BotonGoogleLogin } from '../../componentes/boton-google-login/boton-google-login';
import { CredencialesLogin, ResultadoLogin } from '../../modelos/autenticacion.model';

type ModoAutenticacion = 'login' | 'registro';

@Component({
  selector: 'app-pagina-login',
  imports: [ReactiveFormsModule, RouterLink, BotonGoogleLogin],
  templateUrl: './pagina-login.html',
  styleUrl: './pagina-login.css',
})
export class PaginaLogin implements OnInit {
  private readonly autenticacionApi = inject(AutenticacionApiService);
  private readonly usuarioApi = inject(UsuarioApiService);
  private readonly sesionAutenticacion = inject(SesionAutenticacionService);
  private readonly rutaActiva = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly estaEnviando = signal(false);
  readonly estaProcesandoGoogle = signal(false);
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
  readonly estaBloqueado = computed(
    () =>
      this.estaEnviando() ||
      this.estaProcesandoGoogle() ||
      (this.modo() === 'login' && this.segundosBloqueo() > 0),
  );
  readonly mensajeError = signal('');
  readonly mensajeRegistro = signal('');
  readonly mostrarContrasena = signal(false);
  readonly mostrarContrasenaRegistro = signal(false);
  readonly mostrarConfirmacionRegistro = signal(false);
  readonly modo = signal<ModoAutenticacion>('login');
  private retornoSeguro: string | null = null;

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

  readonly formularioRegistro = new FormGroup({
    nombres: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
    apellidos: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
    correo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    telefono: new FormControl('', { nonNullable: true }),
    contrasena: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
    }),
    confirmarContrasena: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    aceptaTerminos: new FormControl(false, {
      nonNullable: true,
      validators: [Validators.requiredTrue],
    }),
  });

  ngOnInit(): void {
    this.rutaActiva.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((parametros) => {
        if (parametros.get('contexto') === 'admin') {
          void this.router.navigate(['/admin/login'], { replaceUrl: true });
          return;
        }

        this.mensajeError.set('');
        this.mensajeRegistro.set('');
        this.retornoSeguro = this.obtenerRetornoSeguro(parametros.get('retorno'));

        if (parametros.get('modo') === 'registro') {
          this.modo.set('registro');
        }

        if (parametros.get('contrasenaActualizada') === 'true') {
          this.mensajeRegistro.set(
            'Contraseña actualizada. Inicia sesión nuevamente con tu nueva contraseña.',
          );
        }
      });

    interval(1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.relojBloqueo.update((valor) => valor + 1));
  }

  cambiarModo(modo: ModoAutenticacion): void {
    this.modo.set(modo);
    this.mensajeError.set('');
    this.mensajeRegistro.set('');
    this.estaProcesandoGoogle.set(false);
  }

  enviarLogin(): void {
    this.mensajeError.set('');
    this.estaProcesandoGoogle.set(false);

    if (this.estaBloqueado()) return;

    if (this.formularioLogin.invalid) {
      this.formularioLogin.markAllAsTouched();
      return;
    }

    const credenciales = this.obtenerCredenciales();
    const solicitud = this.autenticacionApi.iniciarSesionPublica(credenciales);

    this.estaEnviando.set(true);

    solicitud.pipe(finalize(() => this.estaEnviando.set(false))).subscribe({
      next: (resultado) => this.procesarLoginExitoso(resultado),
      error: (error: unknown) => this.mensajeError.set(this.obtenerMensajeErrorLogin(error)),
    });
  }

  enviarRegistro(): void {
    this.mensajeError.set('');
    this.mensajeRegistro.set('');
    this.estaProcesandoGoogle.set(false);

    if (this.formularioRegistro.invalid || !this.contrasenasRegistroCoinciden()) {
      this.formularioRegistro.markAllAsTouched();
      return;
    }

    this.estaEnviando.set(true);

    this.usuarioApi
      .crearUsuario(this.obtenerSolicitudRegistro())
      .pipe(finalize(() => this.estaEnviando.set(false)))
      .subscribe({
        next: () => {
          const correoRegistrado = this.formularioRegistro.controls.correo.value
            .trim()
            .toLowerCase();
          this.formularioLogin.controls.correo.setValue(correoRegistrado);
          this.formularioLogin.controls.contrasena.setValue('');
          this.formularioRegistro.reset();
          this.modo.set('login');
          this.mensajeRegistro.set(
            `Cuenta creada. Revisa ${correoRegistrado} y confirma tu correo. Podrás navegar, pero necesitaremos verificarlo antes de confirmar pedidos o gestionar una tienda.`,
          );
        },
        error: (error: unknown) => this.mensajeError.set(this.obtenerMensajeErrorRegistro(error)),
      });
  }

  enviarLoginGoogle(idToken: string): void {
    if (this.estaBloqueado()) return;

    this.mensajeError.set('');
    this.mensajeRegistro.set('');
    this.estaProcesandoGoogle.set(true);

    this.autenticacionApi
      .iniciarSesionGoogle(idToken)
      .pipe(
        finalize(() => {
          this.estaProcesandoGoogle.set(false);
        }),
      )
      .subscribe({
        next: (resultado) => this.procesarLoginExitoso(resultado),
        error: (error: unknown) => this.mensajeError.set(this.obtenerMensajeErrorGoogle(error)),
      });
  }

  mostrarErrorGoogle(mensaje: string): void {
    this.estaProcesandoGoogle.set(false);
    this.mensajeRegistro.set('');
    this.mensajeError.set(mensaje);
  }

  alternarVisibilidadContrasena(): void {
    this.mostrarContrasena.update((valor) => !valor);
  }

  alternarVisibilidadContrasenaRegistro(): void {
    this.mostrarContrasenaRegistro.update((valor) => !valor);
  }

  alternarVisibilidadConfirmacionRegistro(): void {
    this.mostrarConfirmacionRegistro.update((valor) => !valor);
  }

  campoLoginTieneError(nombreCampo: 'correo' | 'contrasena'): boolean {
    const campo = this.formularioLogin.controls[nombreCampo];
    return campo.invalid && (campo.touched || campo.dirty);
  }

  campoRegistroTieneError(nombreCampo: keyof typeof this.formularioRegistro.controls): boolean {
    const campo = this.formularioRegistro.controls[nombreCampo];
    return campo.invalid && (campo.touched || campo.dirty);
  }

  contrasenasRegistroCoinciden(): boolean {
    return (
      this.formularioRegistro.controls.contrasena.value ===
      this.formularioRegistro.controls.confirmarContrasena.value
    );
  }

  private obtenerCredenciales(): CredencialesLogin {
    const valor = this.formularioLogin.getRawValue();

    return {
      correo: valor.correo,
      contrasena: valor.contrasena,
    };
  }

  private obtenerSolicitudRegistro(): SolicitudCrearUsuario {
    const valor = this.formularioRegistro.getRawValue();

    return {
      nombres: valor.nombres,
      apellidos: valor.apellidos,
      correo: valor.correo,
      telefono: valor.telefono || null,
      contrasena: valor.contrasena,
    };
  }

  private procesarLoginExitoso(resultado: ResultadoLogin): void {
    this.limpiarEstadoIntentos();
    const rolPrincipal = this.obtenerRolPrincipal(resultado.roles);
    const sesion: SesionAutenticacion = {
      token: resultado.token,
      // El backend informa duracion; el frontend la usa para evitar sesiones locales vencidas.
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

    void this.router.navigateByUrl(this.retornoSeguro ?? this.obtenerRutaInicial(rolPrincipal));
  }

  private obtenerRolPrincipal(roles: RolUsuario[]): RolUsuario {
    if (roles.includes('ADMIN')) return 'ADMIN';
    if (roles.includes('VENDEDOR')) return 'VENDEDOR';
    return 'CLIENTE';
  }

  private obtenerRutaInicial(rol: RolUsuario): string {
    if (rol === 'ADMIN') return '/admin';
    if (rol === 'VENDEDOR') return '/vendedor';
    return '/cliente';
  }

  private obtenerRetornoSeguro(retorno: string | null): string | null {
    if (!retorno || !retorno.startsWith('/') || retorno.startsWith('//')) {
      return null;
    }

    return retorno;
  }

  private obtenerMensajeErrorLogin(error: unknown): string {
    const errorNormalizado = normalizarErrorApi(error);
    this.aplicarEstadoIntentos(errorNormalizado.datos);

    if (errorNormalizado.tipo === 'limite') {
      return this.segundosBloqueo() > 0
        ? ''
        : errorNormalizado.message ||
            'Acceso bloqueado temporalmente. Intenta nuevamente más tarde.';
    }

    if (this.segundosBloqueo() > 0) {
      return '';
    }

    if (errorNormalizado.estado === 401 || errorNormalizado.tipo === 'autenticacion') {
      return 'Correo o contraseña incorrectos.';
    }

    return errorNormalizado.message || 'No se pudo iniciar sesión.';
  }

  private obtenerMensajeErrorRegistro(error: unknown): string {
    return obtenerMensajeErrorUsuario(error, 'No se pudo crear la cuenta.');
  }

  private obtenerMensajeErrorGoogle(error: unknown): string {
    const errorNormalizado = normalizarErrorApi(error);
    this.aplicarEstadoIntentos(errorNormalizado.datos);

    if (errorNormalizado.tipo === 'limite') {
      return this.segundosBloqueo() > 0
        ? ''
        : errorNormalizado.message ||
            'Acceso bloqueado temporalmente. Intenta nuevamente más tarde.';
    }

    if (this.segundosBloqueo() > 0) {
      return '';
    }
    const accion = this.modo() === 'registro' ? 'crear tu cuenta' : 'iniciar sesión';

    if (errorNormalizado.tipo === 'red' || errorNormalizado.tipo === 'timeout') {
      return 'No pudimos conectar con Google o REGALIA. Inténtalo nuevamente en unos segundos.';
    }

    if (errorNormalizado.estado === 401 || errorNormalizado.tipo === 'autenticacion') {
      return `No pudimos validar tu cuenta de Google para ${accion}. Vuelve a intentarlo.`;
    }

    if (errorNormalizado.estado === 403 || errorNormalizado.tipo === 'autorizacion') {
      return 'Tu cuenta no tiene permisos para acceder a REGALIA con Google.';
    }

    if (errorNormalizado.estado === 409 || errorNormalizado.tipo === 'conflicto') {
      return 'Este correo ya está registrado. Inicia sesión con tu contraseña y vincula Google desde tu perfil.';
    }

    if (errorNormalizado.tipo === 'validacion') {
      return 'Google no devolvió una identidad válida. Elige otra cuenta o intenta nuevamente.';
    }

    if (errorNormalizado.tipo === 'servidor') {
      return 'REGALIA no pudo completar el acceso con Google. Inténtalo nuevamente en unos minutos.';
    }

    return errorNormalizado.message || `No se pudo ${accion} con Google.`;
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
