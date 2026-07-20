import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TipoProducto } from '../../../../domains/datos-maestros/modelos/tipo-producto.model';
import { EstadoPantallaComponent } from '../../../../shared/ui/estado-pantalla/estado-pantalla';

@Component({
  selector: 'app-hero-inicio',
  imports: [EstadoPantallaComponent, ReactiveFormsModule, RouterLink],
  templateUrl: './hero-inicio.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroInicio {
  readonly controlBusqueda = input.required<FormControl<string>>();
  readonly categorias = input.required<readonly TipoProducto[]>();
  readonly cargandoCategorias = input.required<boolean>();
  readonly mensajeErrorCategorias = input.required<string | null>();
  readonly buscarRegalos = output<void>();
  readonly buscarCategoria = output<TipoProducto>();
  readonly reintentarCategorias = output<void>();
}
