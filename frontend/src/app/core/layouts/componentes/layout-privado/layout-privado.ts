import { Component, computed, inject, input } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { BotonDirective } from '../../../../shared/directivas/boton.directive';
import { SesionAutenticacionService } from '../../../autenticacion/sesion-autenticacion.service';

export type VarianteLayoutPrivado = 'cliente' | 'vendedor' | 'administracion';

export interface EnlaceLayoutPrivado {
  etiqueta: string;
  ruta: string;
  descripcion: string;
}

@Component({
  selector: 'app-layout-privado',
  imports: [RouterLink, RouterLinkActive, BotonDirective],
  templateUrl: './layout-privado.html',
  styleUrl: './layout-privado.css',
})
export class LayoutPrivadoComponent {
  readonly titulo = input.required<string>();
  readonly etiqueta = input.required<string>();
  readonly descripcion = input.required<string>();
  readonly variante = input<VarianteLayoutPrivado>('cliente');
  readonly enlaces = input<EnlaceLayoutPrivado[]>([]);

  readonly sesion = inject(SesionAutenticacionService);
  readonly inicialesUsuario = computed(() => {
    const nombre = this.sesion.usuarioActual()?.nombreCompleto ?? 'Usuario REGALIA';
    return nombre
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte[0]?.toUpperCase())
      .join('');
  });

  private readonly router = inject(Router);

  cerrarSesion(): void {
    this.sesion.cerrarSesion();
    void this.router.navigateByUrl('/');
  }
}
