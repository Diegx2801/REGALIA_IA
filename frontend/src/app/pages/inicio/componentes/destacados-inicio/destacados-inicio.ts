import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TarjetaProducto } from '../../../../domains/catalogo/componentes/tarjeta-producto/tarjeta-producto';
import { Producto } from '../../../../domains/catalogo/modelos/producto.model';
import { TiendaPublica } from '../../../../domains/tiendas/modelos/tienda-publica.model';
import { EstadoPantallaComponent } from '../../../../shared/ui/estado-pantalla/estado-pantalla';
import { SkeletonCard } from '../../../../shared/ui/skeleton-card/skeleton-card';

@Component({
  selector: 'app-destacados-inicio',
  imports: [EstadoPantallaComponent, RouterLink, SkeletonCard, TarjetaProducto],
  templateUrl: './destacados-inicio.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DestacadosInicio {
  readonly tiendas = input.required<readonly TiendaPublica[]>();
  readonly productos = input.required<readonly Producto[]>();
  readonly cargandoTiendas = input.required<boolean>();
  readonly cargandoProductos = input.required<boolean>();
  readonly mensajeErrorTiendas = input.required<string | null>();
  readonly mensajeErrorProductos = input.required<string | null>();
  readonly mensajeCarrito = input.required<string | null>();
  readonly explorarTienda = output<TiendaPublica>();
  readonly agregarProducto = output<Producto>();
  readonly reintentarTiendas = output<void>();
  readonly reintentarProductos = output<void>();

  obtenerIniciales(nombre: string): string {
    return nombre
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte[0])
      .join('')
      .toUpperCase();
  }
}
