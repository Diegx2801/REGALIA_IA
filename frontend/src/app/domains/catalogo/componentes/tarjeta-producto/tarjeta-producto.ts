import { CurrencyPipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BotonDirective } from '../../../../shared/directivas/boton.directive';
import { Producto } from '../../modelos/producto.model';

@Component({
  selector: 'app-tarjeta-producto',
  imports: [CurrencyPipe, RouterLink, BotonDirective],
  templateUrl: './tarjeta-producto.html',
  styleUrl: './tarjeta-producto.css',
})
export class TarjetaProducto {
  readonly producto = input.required<Producto>();

  readonly imagenPrincipal = computed(
    () => this.producto().imagenes[0]?.urlImagen ?? '/assets/brand/producto-fallback.svg',
  );

  readonly stockBajo = computed(() => this.producto().stock > 0 && this.producto().stock <= 3);
}
