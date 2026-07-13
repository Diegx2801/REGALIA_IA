import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BotonDirective } from '../../directivas/boton.directive';

export type TipoEstadoPantalla = 'carga' | 'error' | 'exito' | 'vacio';

@Component({
  selector: 'app-estado-pantalla',
  imports: [BotonDirective, RouterLink],
  templateUrl: './estado-pantalla.html',
  styleUrl: './estado-pantalla.css',
})
export class EstadoPantallaComponent {
  readonly tipo = input<TipoEstadoPantalla>('vacio');
  readonly etiqueta = input.required<string>();
  readonly titulo = input.required<string>();
  readonly descripcion = input<string | null>(null);
  readonly textoAccion = input<string | null>(null);
  readonly rutaAccion = input<string | unknown[] | null>(null);

  readonly accion = output<void>();

  ejecutarAccion(): void {
    // El componente no decide navegacion ni reintentos; solo comunica la accion al contenedor.
    this.accion.emit();
  }
}
