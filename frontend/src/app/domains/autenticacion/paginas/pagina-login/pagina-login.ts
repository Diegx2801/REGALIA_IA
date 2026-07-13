import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { RolUsuario, SesionAutenticacion } from '../../../../core/autenticacion/sesion-autenticacion.model';
import { SesionAutenticacionService } from '../../../../core/autenticacion/sesion-autenticacion.service';
import { normalizarErrorApi, obtenerMensajeErrorUsuario } from '../../../../core/http/modelos/error-api.model';
import { UsuarioApiService } from '../../../usuarios/acceso-datos/usuario-api.service';
import { SolicitudCrearUsuario } from '../../../usuarios/modelos/usuario.model';
import { AutenticacionApiService } from '../../acceso-datos/autenticacion-api.service';
import { CredencialesLogin, ResultadoLogin } from '../../modelos/autenticacion.model';

type ModoAutenticacion = 'login' | 'registro';

@Component({
  selector: 'app-pagina-login',
  imports: [ReactiveFormsModule, RouterLink],
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
  readonly mensajeError = signal('');
  readonly mensajeRegistro = signal('');
  readonly esLoginAdministracion = signal(false);
  readonly mostrarContrasena = signal(false);
  readonly mostrarContrasenaRegistro = signal(false);
  readonly mostrarConfirmacionRegistro = signal(false);
  readonly modo = signal<ModoAutenticacion>('login');

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
        this.esLoginAdministracion.set(parametros.get('contexto') === 'admin');
        this.mensajeError.set('');
        this.mensajeRegistro.set('');
      });
  }

  cambiarModo(modo: ModoAutenticacion): void {
    this.modo.set(modo);
    this.mensajeError.set('');
    this.mensajeRegistro.set('');
  }

  enviarLogin(): void {
    this.mensajeError.set('');

    if (this.formularioLogin.invalid) {
      this.formularioLogin.markAllAsTouched();
      return;
    }

    const credenciales = this.obtenerCredenciales();
    const solicitud = this.esLoginAdministracion()
      ? this.autenticacionApi.iniciarSesionAdministracion(credenciales)
      : this.autenticacionApi.iniciarSesionPublica(credenciales);

    this.estaEnviando.set(true);

    solicitud.pipe(finalize(() => this.estaEnviando.set(false))).subscribe({
      next: (resultado) => this.procesarLoginExitoso(resultado),
      error: (error: unknown) => this.mensajeError.set(this.obtenerMensajeErrorLogin(error)),
    });
  }

  enviarRegistro(): void {
    this.mensajeError.set('');
    this.mensajeRegistro.set('');

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
          this.formularioLogin.controls.correo.setValue(this.formularioRegistro.controls.correo.value);
          this.formularioLogin.controls.contrasena.setValue('');
          this.formularioRegistro.reset();
          this.modo.set('login');
          this.mensajeRegistro.set('Cuenta creada correctamente. Ahora puedes iniciar sesion.');
        },
        error: (error: unknown) => this.mensajeError.set(this.obtenerMensajeErrorRegistro(error)),
      });
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

  campoRegistroTieneError(
    nombreCampo: keyof typeof this.formularioRegistro.controls,
  ): boolean {
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
    const rolPrincipal = this.obtenerRolPrincipal(resultado.roles);
    const sesion: SesionAutenticacion = {
      token: resultado.token,
      // El backend informa duracion; el frontend la usa para evitar sesiones locales vencidas.
      expiraEn: Date.now() + resultado.expiraEnMinutos * 60_000,
      usuario: {
        idUsuario: resultado.idUsuario,
        correo: resultado.correo,
        nombreCompleto: resultado.correo,
        rol: rolPrincipal,
      },
    };

    this.sesionAutenticacion.iniciarSesion(
      sesion,
      this.formularioLogin.controls.recordarSesion.value,
    );

    void this.router.navigateByUrl(this.obtenerRutaInicial(rolPrincipal));
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

  private obtenerMensajeErrorLogin(error: unknown): string {
    const errorNormalizado = normalizarErrorApi(error);

    if (errorNormalizado.estado === 401 || errorNormalizado.tipo === 'autenticacion') {
      return 'Correo o contrasena incorrectos.';
    }

    return errorNormalizado.message || 'No se pudo iniciar sesion.';
  }

  private obtenerMensajeErrorRegistro(error: unknown): string {
    return obtenerMensajeErrorUsuario(error, 'No se pudo crear la cuenta.');
  }
}
