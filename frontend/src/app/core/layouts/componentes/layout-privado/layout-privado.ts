import { Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { BotonDirective } from '../../../../shared/directivas/boton.directive';
import { SesionAutenticacionService } from '../../../autenticacion/sesion-autenticacion.service';

export type VarianteLayoutPrivado = 'cliente' | 'vendedor' | 'administracion';

export interface EnlaceLayoutPrivado {
  etiqueta: string;
  ruta: string;
  descripcion: string;
  queryParams?: Record<string, string>;
}

@Component({
  selector: 'app-layout-privado',
  imports: [RouterLink, RouterLinkActive, NgbTooltip, BotonDirective],
  templateUrl: './layout-privado.html',
  styleUrl: './layout-privado.css',
})
export class LayoutPrivadoComponent {
  readonly titulo = input.required<string>();
  readonly etiqueta = input.required<string>();
  readonly descripcion = input.required<string>();
  readonly variante = input<VarianteLayoutPrivado>('cliente');
  readonly enlaces = input<EnlaceLayoutPrivado[]>([]);
  readonly menuMovilAbierto = signal(false);

  readonly sesion = inject(SesionAutenticacionService);
  readonly nombreVisible = computed(() => {
    const usuario = this.sesion.usuarioActual();
    const nombre = usuario?.nombreCompleto?.trim();
    const correo = usuario?.correo?.trim();

    // Durante el login actual, el backend aun no entrega nombres; evita repetir el correo como nombre y subtitulo.
    if (
      !nombre ||
      (correo && nombre.localeCompare(correo, undefined, { sensitivity: 'accent' }) === 0)
    ) {
      return 'Cuenta REGALIA';
    }

    return nombre;
  });
  readonly inicialesUsuario = computed(() => {
    const nombre = this.nombreVisible();
    return nombre
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte[0]?.toUpperCase())
      .join('');
  });
  readonly rolVisible = computed(() => this.sesion.rolActual() ?? 'INVITADO');

  private readonly router = inject(Router);

  alternarMenuMovil(): void {
    this.menuMovilAbierto.update((abierto) => !abierto);
  }

  cerrarMenuMovil(): void {
    this.menuMovilAbierto.set(false);
  }

  cerrarSesion(): void {
    this.sesion.cerrarSesion();
    void this.router.navigateByUrl('/');
  }
}
