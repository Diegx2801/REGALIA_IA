import { CurrencyPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Producto } from '../../../../domains/catalogo/modelos/producto.model';
import { EstadoPantallaComponent } from '../../../../shared/ui/estado-pantalla/estado-pantalla';
import { InsigniaUi } from '../../../../shared/ui/insignia-ui/insignia-ui';
import { SkeletonCard } from '../../../../shared/ui/skeleton-card/skeleton-card';

@Component({
  selector: 'app-destacados-inicio',
  imports: [CurrencyPipe, EstadoPantallaComponent, InsigniaUi, RouterLink, SkeletonCard],
  templateUrl: './destacados-inicio.html',
})
export class DestacadosInicio {
  readonly productos = input.required<readonly Producto[]>();
  readonly cargando = input.required<boolean>();
  readonly mensajeError = input.required<string | null>();

  obtenerImagenProducto(producto: Producto): string {
    return producto.imagenes[0]?.urlImagen ?? '/assets/brand/producto-fallback.svg';
  }

  identificarProducto(_indice: number, producto: Producto): number {
    return producto.idProducto;
  }
}
