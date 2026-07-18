import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import {
  RolUsuario,
  SesionAutenticacion,
} from '../../../../core/autenticacion/sesion-autenticacion.model';
import { SesionAutenticacionService } from '../../../../core/autenticacion/sesion-autenticacion.service';
import { AutenticacionApiService } from '../../acceso-datos/autenticacion-api.service';
import { CredencialesLogin, ResultadoLogin } from '../../modelos/autenticacion.model';

@Component({
  selector: 'app-pagina-admin-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './pagina-admin-login.html',
  styleUrl: './pagina-admin-login.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaAdminLogin {
  private readonly autenticacionApi = inject(AutenticacionApiService);
  private readonly sesionAutenticacion = inject(SesionAutenticacionService);
  private readonly router = inject(Router);

  readonly estaEnviando = signal(false);
  readonly mensajeError = signal('');
  readonly mostrarContrasena = signal(false);

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

  alternarContrasena(): void {
    this.mostrarContrasena.update((valor) => !valor);
  }

  enviarLogin(): void {
    this.mensajeError.set('');

    if (this.formularioLogin.invalid) {
      this.formularioLogin.markAllAsTouched();
      this.mensajeError.set('Ingresa tu correo administrativo y contrasena.');
      return;
    }

    this.estaEnviando.set(true);

    this.autenticacionApi
      .iniciarSesionAdministracion(this.obtenerCredenciales())
      .pipe(finalize(() => this.estaEnviando.set(false)))
      .subscribe({
        next: (resultado) => this.procesarLoginExitoso(resultado),
        error: () =>
          this.mensajeError.set(
            'No pudimos iniciar sesion administrativa. Revisa tus credenciales.',
          ),
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
    void this.router.navigateByUrl('/admin');
  }

  private obtenerRolPrincipal(roles: RolUsuario[]): RolUsuario {
    return roles.includes('ADMIN') ? 'ADMIN' : roles[0] ?? 'CLIENTE';
  }
}
