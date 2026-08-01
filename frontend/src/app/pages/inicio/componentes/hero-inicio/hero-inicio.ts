import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TipoProducto } from '../../../../domains/datos-maestros/modelos/tipo-producto.model';
import { EstadoPantallaComponent } from '../../../../shared/ui/estado-pantalla/estado-pantalla';
import { IconoRegalia, IntencionRegalo } from '../../modelos/inicio.model';

@Component({
  selector: 'app-hero-inicio',
  imports: [EstadoPantallaComponent, ReactiveFormsModule, RouterLink],
  templateUrl: './hero-inicio.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroInicio {
  readonly controlBusqueda = input.required<FormControl<string>>();
  readonly controlTipo = input.required<FormControl<string>>();
  readonly controlPresupuesto = input.required<FormControl<number>>();
  readonly categorias = input.required<readonly TipoProducto[]>();
  readonly intenciones = input.required<readonly IntencionRegalo[]>();
  readonly cargandoCategorias = input.required<boolean>();
  readonly mensajeErrorCategorias = input.required<string | null>();
  readonly buscarRegalos = output<void>();
  readonly buscarIntencion = output<IntencionRegalo>();
  readonly buscarCategoria = output<TipoProducto>();
  readonly reintentarCategorias = output<void>();

  iconoCategoria(nombre: string): IconoRegalia {
    const nombreNormalizado = nombre
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    if (nombreNormalizado.includes('floral') || nombreNormalizado.includes('flor')) return 'floral';
    if (nombreNormalizado.includes('pack') || nombreNormalizado.includes('box')) return 'box';
    if (
      nombreNormalizado.includes('comestible') ||
      nombreNormalizado.includes('torta') ||
      nombreNormalizado.includes('alimento')
    ) {
      return 'comestible';
    }
    if (nombreNormalizado.includes('personalizado')) return 'personalizado';
    if (nombreNormalizado.includes('accesorio')) return 'accesorio';
    return 'fisico';
  }
}
