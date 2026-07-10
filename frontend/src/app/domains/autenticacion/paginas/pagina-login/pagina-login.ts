import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { RolUsuario, SesionAutenticacion } from '../../../../core/autenticacion/sesion-autenticacion.model';
import { SesionAutenticacionService } from '../../../../core/autenticacion/sesion-autenticacion.service';
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
    this.mensajeRegistro.set('');

    if (this.formularioRegistro.invalid || !this.contrasenasRegistroCoinciden()) {
      this.formularioRegistro.markAllAsTouched();
      return;
    }

    // El backend actual no expone registro publico en el frontend; dejamos la UI lista sin inventar endpoint.
    this.mensajeRegistro.set(
      'La interfaz de registro esta lista. Falta conectar el endpoint publico de creacion de cuenta.',
    );
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
    const mensaje = error instanceof Error ? error.message : '';

    if (mensaje.includes('Http failure response') || mensaje.includes('Unknown Error')) {
      return 'No pudimos conectar con el backend de REGALIA. Verifica que el servidor este activo.';
    }

    if (mensaje.toLowerCase().includes('unauthorized') || mensaje.includes('401')) {
      return 'Correo o contrasena incorrectos.';
    }

    return mensaje || 'No se pudo iniciar sesion.';
  }
}
