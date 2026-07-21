import { CurrencyPipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { Producto } from '../../../../domains/catalogo/modelos/producto.model';
import { RecomendacionProductoIa } from '../../modelos/builder-ia.model';
import { EstadoPantallaComponent } from '../../../../shared/ui/estado-pantalla/estado-pantalla';
import { InsigniaUi } from '../../../../shared/ui/insignia-ui/insignia-ui';
import { TarjetaInformativa } from '../../../../shared/ui/tarjeta-informativa/tarjeta-informativa';

@Component({
  selector: 'app-fase-recomendaciones-ia',
  imports: [CurrencyPipe, EstadoPantallaComponent, InsigniaUi, TarjetaInformativa],
  templateUrl: './fase-recomendaciones-ia.html',
})
export class FaseRecomendacionesIa {
  readonly productos = input.required<readonly RecomendacionProductoIa[]>();
  readonly productoSeleccionado = input.required<Producto | null>();
  readonly seleccionarProducto = output<Producto>();
  readonly buscarEnCatalogo = output<void>();
  readonly volver = output<void>();
  readonly continuar = output<void>();

  identificarProducto(_indice: number, recomendacion: RecomendacionProductoIa): number {
    return recomendacion.producto.idProducto;
  }
}
