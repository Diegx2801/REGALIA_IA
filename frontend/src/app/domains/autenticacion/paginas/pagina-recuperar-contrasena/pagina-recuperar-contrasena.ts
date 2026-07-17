import { Location } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { obtenerMensajeErrorUsuario } from '../../../../core/http/modelos/error-api.model';
import { AutenticacionApiService } from '../../acceso-datos/autenticacion-api.service';

type ModoRecuperacion = 'solicitud' | 'restablecimiento' | 'completado';

@Component({
  selector: 'app-pagina-recuperar-contrasena',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './pagina-recuperar-contrasena.html',
  styleUrl: './pagina-recuperar-contrasena.css',
})
export class PaginaRecuperarContrasena implements OnInit {
  private readonly autenticacionApi = inject(AutenticacionApiService);
  private readonly rutaActiva = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly destroyRef = inject(DestroyRef);

  readonly modo = signal<ModoRecuperacion>('solicitud');
  readonly enviando = signal(false);
  readonly mensaje = signal('');
  readonly esError = signal(false);
  readonly mostrarContrasena = signal(false);
  readonly mostrarConfirmacion = signal(false);
  private tokenRestablecimiento = '';

  readonly formularioSolicitud = new FormGroup({
    correo: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
  });

  readonly formularioRestablecimiento = new FormGroup({
    nuevaContrasena: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
    }),
    confirmarContrasena: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  ngOnInit(): void {
    const token = this.obtenerTokenDesdeFragmento();
    if (!token) return;

    this.tokenRestablecimiento = token;
    this.modo.set('restablecimiento');
    // El fragmento nunca llega a la API y se limpia para no conservar el token en historial.
    this.location.replaceState('/restablecer-contrasena');
  }

  solicitarRecuperacion(): void {
    this.limpiarMensaje();
    if (this.formularioSolicitud.invalid) {
      this.formularioSolicitud.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.autenticacionApi
      .solicitarRecuperacionContrasena(this.formularioSolicitud.controls.correo.value.trim())
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.enviando.set(false)))
      .subscribe({
        next: (mensaje) => this.mensaje.set(mensaje),
        error: (error: unknown) => this.mostrarError(error, 'No pudimos procesar tu solicitud. Intentalo nuevamente.'),
      });
  }

  restablecerContrasena(): void {
    this.limpiarMensaje();
    if (
      !this.tokenRestablecimiento ||
      this.formularioRestablecimiento.invalid ||
      !this.contrasenasCoinciden()
    ) {
      this.formularioRestablecimiento.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.autenticacionApi
      .restablecerContrasena(
        this.tokenRestablecimiento,
        this.formularioRestablecimiento.controls.nuevaContrasena.value,
      )
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.enviando.set(false)))
      .subscribe({
        next: (mensaje) => {
          this.tokenRestablecimiento = '';
          this.mensaje.set(mensaje);
          this.modo.set('completado');
        },
        error: (error: unknown) =>
          this.mostrarError(error, 'El enlace expiro, ya fue usado o no se pudo validar.'),
      });
  }

  contrasenasCoinciden(): boolean {
    return (
      this.formularioRestablecimiento.controls.nuevaContrasena.value ===
      this.formularioRestablecimiento.controls.confirmarContrasena.value
    );
  }

  alternarVisibilidadContrasena(): void {
    this.mostrarContrasena.update((valor) => !valor);
  }

  alternarVisibilidadConfirmacion(): void {
    this.mostrarConfirmacion.update((valor) => !valor);
  }

  private obtenerTokenDesdeFragmento(): string | null {
    const fragmento = this.rutaActiva.snapshot.fragment;
    return fragmento ? new URLSearchParams(fragmento).get('token')?.trim() || null : null;
  }

  private limpiarMensaje(): void {
    this.mensaje.set('');
    this.esError.set(false);
  }

  private mostrarError(error: unknown, mensajePredeterminado: string): void {
    this.esError.set(true);
    this.mensaje.set(obtenerMensajeErrorUsuario(error, mensajePredeterminado));
  }
}
