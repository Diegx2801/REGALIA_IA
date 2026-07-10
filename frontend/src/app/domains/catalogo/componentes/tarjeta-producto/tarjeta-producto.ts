import { CurrencyPipe } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Producto } from '../../modelos/producto.model';

@Component({
  selector: 'app-tarjeta-producto',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './tarjeta-producto.html',
  styleUrl: './tarjeta-producto.css',
})
export class TarjetaProducto {
  readonly producto = input.required<Producto>();
  readonly agregar = output<Producto>();

  readonly imagenPrincipal = computed(
    () => this.producto().imagenes[0]?.urlImagen ?? '/assets/brand/producto-fallback.svg',
  );

  readonly etiquetaEstado = computed(() => (this.producto().disponible ? 'Disponible' : 'Agotado'));

  agregarAlCarrito(): void {
    const producto = this.producto();
    if (!producto.disponible || producto.stock <= 0) return;
    this.agregar.emit(producto);
  }
}
