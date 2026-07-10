import { CurrencyPipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, EMPTY, finalize, switchMap, tap } from 'rxjs';
import { ProductoApiService } from '../../acceso-datos/producto-api.service';
import { Producto } from '../../modelos/producto.model';
import { CarritoCheckoutService } from '../../../../core/carrito/carrito-checkout.service';
import { BotonDirective } from '../../../../shared/directivas/boton.directive';

@Component({
  selector: 'app-pagina-detalle-producto',
  imports: [CurrencyPipe, RouterLink, BotonDirective],
  templateUrl: './pagina-detalle-producto.html',
  styleUrl: './pagina-detalle-producto.css',
})
export class PaginaDetalleProducto implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly productoApiService = inject(ProductoApiService);
  private readonly carritoCheckout = inject(CarritoCheckoutService);

  readonly producto = signal<Producto | null>(null);
  readonly cargandoProducto = signal(true);
  readonly mensajeError = signal<string | null>(null);
  readonly indiceImagenActiva = signal(0);
  readonly cantidadSeleccionada = signal(1);

  readonly imagenActiva = computed(() => {
    const productoActual = this.producto();
    return (
      productoActual?.imagenes[this.indiceImagenActiva()]?.urlImagen ??
      '/assets/brand/producto-fallback.svg'
    );
  });

  readonly totalEstimado = computed(() => {
    const productoActual = this.producto();
    return productoActual ? productoActual.precio * this.cantidadSeleccionada() : 0;
  });

  readonly stockTexto = computed(() => {
    const productoActual = this.producto();
    if (!productoActual) return '';
    if (!productoActual.disponible) return 'Agotado temporalmente';
    if (productoActual.stock <= 5) return `Ultimas ${productoActual.stock} unidades`;
    return `${productoActual.stock} unidades disponibles`;
  });

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        tap(() => {
          this.cargandoProducto.set(true);
          this.mensajeError.set(null);
          this.producto.set(null);
          this.indiceImagenActiva.set(0);
          this.cantidadSeleccionada.set(1);
        }),
        switchMap((parametros) => {
          const idProducto = Number(parametros.get('idProducto'));

          if (!Number.isInteger(idProducto) || idProducto <= 0) {
            this.router.navigateByUrl('/catalogo');
            return EMPTY;
          }

          return this.productoApiService.obtenerProductoPorId(idProducto).pipe(
            tap((producto) => this.producto.set(producto)),
            catchError((error: Error) => {
              this.mensajeError.set(this.obtenerMensajeErrorDetalle(error));
              return EMPTY;
            }),
            finalize(() => this.cargandoProducto.set(false)),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  seleccionarImagen(indice: number): void {
    this.indiceImagenActiva.set(indice);
  }

  disminuirCantidad(producto: Producto): void {
    this.actualizarCantidad(producto, this.cantidadSeleccionada() - 1);
  }

  aumentarCantidad(producto: Producto): void {
    this.actualizarCantidad(producto, this.cantidadSeleccionada() + 1);
  }

  agregarAlCarrito(producto: Producto): void {
    this.carritoCheckout.agregarProducto(producto, this.cantidadSeleccionada());
    this.router.navigateByUrl('/carrito');
  }

  private actualizarCantidad(producto: Producto, cantidad: number): void {
    // El frontend limita la seleccion para UX; stock y precio se validan otra vez en backend.
    const cantidadSegura = Math.max(1, Math.min(cantidad, producto.stock));
    this.cantidadSeleccionada.set(cantidadSegura);
  }

  private obtenerMensajeErrorDetalle(error: Error): string {
    const mensaje = error.message ?? '';
    const esErrorTecnico =
      mensaje.includes('Http failure response') ||
      mensaje.includes('Unknown Error') ||
      mensaje.includes('Timeout');

    return esErrorTecnico
      ? 'No pudimos conectar con el backend de REGALIA para cargar este producto.'
      : mensaje || 'No pudimos cargar el detalle del producto.';
  }
}
