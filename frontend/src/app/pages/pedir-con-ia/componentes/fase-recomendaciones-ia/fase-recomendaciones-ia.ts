import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Producto } from '../../../../domains/catalogo/modelos/producto.model';
import { EstadoPantallaComponent } from '../../../../shared/ui/estado-pantalla/estado-pantalla';
import { InsigniaUi } from '../../../../shared/ui/insignia-ui/insignia-ui';

@Component({
  selector: 'app-fase-recomendaciones-ia',
  imports: [CurrencyPipe, EstadoPantallaComponent, InsigniaUi, RouterLink],
  templateUrl: './fase-recomendaciones-ia.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaseRecomendacionesIa {
  readonly respuestaIa = input.required<string | null>();
  readonly descripcionActual = input.required<string>();
  readonly productos = input.required<readonly Producto[]>();
  readonly productoSeleccionado = input.required<Producto | null>();
  readonly seleccionarProducto = output<Producto>();
  readonly ajustarSolicitud = output<void>();
  readonly buscarEnCatalogo = output<void>();
  readonly volver = output<void>();
  readonly continuar = output<void>();

  identificarProducto(_indice: number, producto: Producto): number {
    return producto.idProducto;
  }

  usarImagenAlternativa(evento: Event): void {
    const imagen = evento.currentTarget as HTMLImageElement;
    if (imagen.src.endsWith('/assets/brand/producto-fallback.svg')) return;
    imagen.src = '/assets/brand/producto-fallback.svg';
  }
}
