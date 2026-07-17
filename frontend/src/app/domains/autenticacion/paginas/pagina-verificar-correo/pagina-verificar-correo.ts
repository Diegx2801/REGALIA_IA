import { Location } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { SesionAutenticacionService } from '../../../../core/autenticacion/sesion-autenticacion.service';
import { VerificacionCorreoApiService } from '../../acceso-datos/verificacion-correo-api.service';

type EstadoVerificacionCorreo = 'cargando' | 'confirmado' | 'error';

interface ConfirmacionCorreoCompletada {
  correo: string;
  confirmadaEn: number;
}

const CLAVE_CONFIRMACION_COMPLETADA = 'regalia.email-verification.completed';
const DURACION_CONFIRMACION_COMPLETADA_MS = 30 * 60 * 1000;

@Component({
  selector: 'app-pagina-verificar-correo',
  imports: [RouterLink],
  templateUrl: './pagina-verificar-correo.html',
  styleUrl: './pagina-verificar-correo.css',
})
export class PaginaVerificarCorreo implements OnInit {
  private readonly rutaActiva = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly verificacionCorreoApi = inject(VerificacionCorreoApiService);
  private readonly sesionAutenticacion = inject(SesionAutenticacionService);
  private readonly destroyRef = inject(DestroyRef);

  readonly estado = signal<EstadoVerificacionCorreo>('cargando');
  readonly titulo = signal('Confirmando tu correo');
  readonly mensaje = signal('Estamos validando el enlace de seguridad de tu cuenta REGALIA.');

  ngOnInit(): void {
    const token = this.obtenerTokenDesdeFragmento();

    if (!token) {
      const confirmacionCompletada = this.obtenerConfirmacionCompletada();
      if (confirmacionCompletada) {
        this.mostrarConfirmacionCompletada(confirmacionCompletada.correo);
        return;
      }

      this.marcarError('El enlace de confirmacion no incluye un token valido. Solicita uno nuevo desde tu perfil.');
      return;
    }

    // El fragmento no llega al servidor; se elimina de inmediato para no dejarlo en el historial.
    this.location.replaceState('/verificar-correo');

    this.verificacionCorreoApi
      .confirmar(token)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resultado) => {
          this.guardarConfirmacionCompletada(resultado.correo);
          this.mostrarConfirmacionCompletada(resultado.correo);
        },
        error: (error: unknown) => {
          this.eliminarConfirmacionCompletada();
          const mensaje =
            error instanceof Error
              ? error.message
              : 'El enlace expiro, ya fue usado o no se pudo validar. Solicita uno nuevo desde tu perfil.';

          this.marcarError(
            mensaje ||
              'El enlace expiro, ya fue usado o no se pudo validar. Solicita uno nuevo desde tu perfil.',
          );
        },
      });
  }

  etiquetaEstado(): string {
    if (this.estado() === 'confirmado') return 'OK';
    if (this.estado() === 'error') return '!';
    return '...';
  }

  private sincronizarSesionConfirmada(correoConfirmado: string): void {
    const usuarioActual = this.sesionAutenticacion.usuarioActual();
    if (!usuarioActual) return;

    const correoSesion = usuarioActual.correo.trim().toLowerCase();
    const correoValidado = correoConfirmado.trim().toLowerCase();

    if (correoSesion !== correoValidado) return;

    this.sesionAutenticacion.actualizarUsuarioActual({ correoVerificado: true });
  }

  private mostrarConfirmacionCompletada(correoConfirmado: string): void {
    this.estado.set('confirmado');
    this.titulo.set('Correo confirmado');
    this.mensaje.set('Tu correo ya esta verificado. Puedes cerrar esta pestaña y volver a REGALIA.');
    this.sincronizarSesionConfirmada(correoConfirmado);
  }

  private guardarConfirmacionCompletada(correo: string): void {
    const confirmacion: ConfirmacionCorreoCompletada = {
      correo,
      confirmadaEn: Date.now(),
    };

    try {
      sessionStorage.setItem(CLAVE_CONFIRMACION_COMPLETADA, JSON.stringify(confirmacion));
    } catch {
      // Si el navegador bloquea storage, la confirmacion sigue siendo valida en backend.
    }
  }

  private obtenerConfirmacionCompletada(): ConfirmacionCorreoCompletada | null {
    try {
      const valor = sessionStorage.getItem(CLAVE_CONFIRMACION_COMPLETADA);
      if (!valor) return null;

      const confirmacion = JSON.parse(valor) as ConfirmacionCorreoCompletada;
      const esValida =
        typeof confirmacion.correo === 'string'
        && typeof confirmacion.confirmadaEn === 'number'
        && Date.now() - confirmacion.confirmadaEn <= DURACION_CONFIRMACION_COMPLETADA_MS;

      if (esValida) return confirmacion;

      this.eliminarConfirmacionCompletada();
      return null;
    } catch {
      this.eliminarConfirmacionCompletada();
      return null;
    }
  }

  private eliminarConfirmacionCompletada(): void {
    try {
      sessionStorage.removeItem(CLAVE_CONFIRMACION_COMPLETADA);
    } catch {
      // No hay accion adicional si el navegador bloquea storage.
    }
  }

  private obtenerTokenDesdeFragmento(): string | null {
    const fragmento = this.rutaActiva.snapshot.fragment;
    if (!fragmento) return null;

    return new URLSearchParams(fragmento).get('token')?.trim() || null;
  }

  private marcarError(mensaje: string): void {
    this.estado.set('error');
    this.titulo.set('No pudimos confirmar el correo');
    this.mensaje.set(mensaje);
  }
}
