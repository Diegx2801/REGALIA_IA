import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { VerificacionCorreoApiService } from '../../acceso-datos/verificacion-correo-api.service';

type EstadoVerificacionCorreo = 'cargando' | 'confirmado' | 'error';

@Component({
  selector: 'app-pagina-verificar-correo',
  imports: [RouterLink],
  templateUrl: './pagina-verificar-correo.html',
  styleUrl: './pagina-verificar-correo.css',
})
export class PaginaVerificarCorreo implements OnInit {
  private readonly rutaActiva = inject(ActivatedRoute);
  private readonly verificacionCorreoApi = inject(VerificacionCorreoApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly estado = signal<EstadoVerificacionCorreo>('cargando');
  readonly titulo = signal('Confirmando tu correo');
  readonly mensaje = signal('Estamos validando el enlace de seguridad de tu cuenta REGALIA.');
  readonly correo = signal('');

  ngOnInit(): void {
    const token = this.rutaActiva.snapshot.queryParamMap.get('token')?.trim();

    if (!token) {
      this.marcarError('El enlace de confirmacion no incluye un token valido.');
      return;
    }

    this.verificacionCorreoApi
      .confirmar(token)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resultado) => {
          this.estado.set('confirmado');
          this.correo.set(resultado.correo);
          this.titulo.set('Correo confirmado');
          this.mensaje.set('Tu cuenta ya puede recibir notificaciones importantes de REGALIA.');
        },
        error: () => {
          this.marcarError(
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

  private marcarError(mensaje: string): void {
    this.estado.set('error');
    this.titulo.set('No pudimos confirmar el correo');
    this.mensaje.set(mensaje);
  }
}
