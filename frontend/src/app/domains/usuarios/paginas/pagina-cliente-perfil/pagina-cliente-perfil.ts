import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { SesionAutenticacionService } from '../../../../core/autenticacion/sesion-autenticacion.service';
import { obtenerMensajeErrorUsuario } from '../../../../core/http/modelos/error-api.model';
import { EstadoPantallaComponent } from '../../../../shared/ui/estado-pantalla/estado-pantalla';
import { BotonGoogleLogin } from '../../../autenticacion/componentes/boton-google-login/boton-google-login';
import { ClientePanelStore } from '../../estado/cliente-panel.store';
import { UsuarioApiService } from '../../acceso-datos/usuario-api.service';
import { PanelDocumentosUsuario } from '../../componentes/panel-documentos-usuario/panel-documentos-usuario';

@Component({
  selector: 'app-pagina-cliente-perfil',
  imports: [
    ReactiveFormsModule,
    EstadoPantallaComponent,
    BotonGoogleLogin,
    PanelDocumentosUsuario,
    RouterLink,
  ],
  templateUrl: './pagina-cliente-perfil.html',
  styleUrl: './pagina-cliente-perfil.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaClientePerfil implements OnInit {
  readonly store = inject(ClientePanelStore);
  private readonly usuarioApi = inject(UsuarioApiService);
  private readonly sesionAutenticacion = inject(SesionAutenticacionService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly cambiandoContrasena = signal(false);
  readonly mensajeCambioContrasena = signal<string | null>(null);
  readonly mostrarContrasenaActual = signal(false);
  readonly mostrarNuevaContrasena = signal(false);
  readonly mostrarConfirmacionContrasena = signal(false);

  readonly iniciales = computed(() => {
    const perfil = this.store.perfil();
    if (!perfil) return 'RG';

    return `${perfil.nombres.charAt(0)}${perfil.apellidos.charAt(0)}`.toUpperCase();
  });

  readonly cantidadMetodosAcceso = computed(
    () => 1 + (this.store.googleVinculado() ? 1 : 0),
  );

  readonly formularioPerfil = new FormGroup({
    nombres: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(/\S/),
        Validators.maxLength(100),
      ],
    }),
    apellidos: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(/\S/),
        Validators.maxLength(100),
      ],
    }),
    telefono: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(20)],
    }),
  });

  readonly formularioContrasena = new FormGroup({
    contrasenaActual: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    }),
    nuevaContrasena: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8), Validators.maxLength(100)],
    }),
    confirmarContrasena: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  constructor() {
    effect(() => {
      const perfil = this.store.perfil();
      if (!perfil) return;

      this.formularioPerfil.patchValue(
        {
          nombres: perfil.nombres,
          apellidos: perfil.apellidos,
          telefono: perfil.telefono === 'Telefono pendiente' ? '' : perfil.telefono,
        },
        { emitEvent: false },
      );
    });
  }

  ngOnInit(): void {
    this.store.cargarPanel();
  }

  guardarPerfil(): void {
    this.store.limpiarMensajes();

    if (this.formularioPerfil.invalid) {
      this.formularioPerfil.markAllAsTouched();
      return;
    }

    const valor = this.formularioPerfil.getRawValue();
    this.store.guardarPerfil({
      nombres: valor.nombres.trim(),
      apellidos: valor.apellidos.trim(),
      telefono: valor.telefono.trim() || null,
    });
  }

  campoTieneError(campo: keyof typeof this.formularioPerfil.controls): boolean {
    const control = this.formularioPerfil.controls[campo];
    return control.invalid && (control.touched || control.dirty);
  }

  vincularGoogle(idToken: string): void {
    this.store.vincularGoogle(idToken);
  }

  registrarErrorGoogle(mensaje: string): void {
    this.store.registrarErrorCuenta(mensaje);
  }

  reenviarVerificacionCorreo(): void {
    this.store.reenviarVerificacionCorreo();
  }

  refrescarEstadoCorreo(): void {
    this.store.refrescarPerfil('Estado del correo actualizado.');
  }

  cambiarContrasena(): void {
    this.mensajeCambioContrasena.set(null);

    if (this.formularioContrasena.invalid || !this.contrasenasCoinciden()) {
      this.formularioContrasena.markAllAsTouched();
      return;
    }

    const valor = this.formularioContrasena.getRawValue();
    this.cambiandoContrasena.set(true);

    this.usuarioApi
      .cambiarContrasena({
        contrasenaActual: valor.contrasenaActual,
        nuevaContrasena: valor.nuevaContrasena,
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.cambiandoContrasena.set(false)),
      )
      .subscribe({
        next: () => {
          this.sesionAutenticacion.cerrarSesion();
          void this.router.navigate(['/login'], {
            queryParams: { contrasenaActualizada: 'true' },
          });
        },
        error: (error: unknown) =>
          this.mensajeCambioContrasena.set(
            obtenerMensajeErrorUsuario(error, 'No pudimos cambiar tu contrasena.'),
          ),
      });
  }

  alternarVisibilidad(campo: 'actual' | 'nueva' | 'confirmacion'): void {
    const visibilidad = {
      actual: this.mostrarContrasenaActual,
      nueva: this.mostrarNuevaContrasena,
      confirmacion: this.mostrarConfirmacionContrasena,
    }[campo];

    visibilidad.update((valor) => !valor);
  }

  formatearMesAnio(fecha: string | null | undefined): string {
    if (!fecha) return 'No disponible';

    const valor = new Date(fecha);
    if (Number.isNaN(valor.getTime())) return 'No disponible';

    return new Intl.DateTimeFormat('es-PE', {
      month: 'long',
      year: 'numeric',
    }).format(valor);
  }

  contrasenasCoinciden(): boolean {
    return (
      this.formularioContrasena.controls.nuevaContrasena.value ===
      this.formularioContrasena.controls.confirmarContrasena.value
    );
  }

  campoContrasenaTieneError(
    campo: keyof typeof this.formularioContrasena.controls,
  ): boolean {
    const control = this.formularioContrasena.controls[campo];
    return control.invalid && (control.touched || control.dirty);
  }
}
