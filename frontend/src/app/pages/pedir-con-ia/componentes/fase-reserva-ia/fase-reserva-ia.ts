import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Producto } from '../../../../domains/catalogo/modelos/producto.model';

@Component({
  selector: 'app-fase-reserva-ia',
  imports: [CurrencyPipe],
  templateUrl: './fase-reserva-ia.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaseReservaIa {
  readonly productoSeleccionado = input.required<Producto | null>();
  readonly mensajeExito = input.required<string | null>();
  readonly productoAgregado = input.required<boolean>();
  readonly buscarEnCatalogo = output<void>();
  readonly volver = output<void>();
  readonly confirmarSolicitud = output<void>();
  readonly irAlCarrito = output<void>();
}
