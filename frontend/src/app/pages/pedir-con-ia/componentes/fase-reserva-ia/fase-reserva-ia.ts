import { CurrencyPipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { Producto } from '../../../../domains/catalogo/modelos/producto.model';

@Component({
  selector: 'app-fase-reserva-ia',
  imports: [CurrencyPipe],
  templateUrl: './fase-reserva-ia.html',
})
export class FaseReservaIa {
  readonly productoSeleccionado = input.required<Producto | null>();
  readonly mensajeExito = input.required<string | null>();
  readonly buscarEnCatalogo = output<void>();
  readonly volver = output<void>();
  readonly confirmarSolicitud = output<void>();
  readonly irAlCarrito = output<void>();
}
