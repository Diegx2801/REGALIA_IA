import { CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, EMPTY, finalize, switchMap, tap } from 'rxjs';
import { CarritoCheckoutService } from '../../../../core/carrito/carrito-checkout.service';
import { obtenerMensajeErrorUsuario } from '../../../../core/http/modelos/error-api.model';
import { BotonDirective } from '../../../../shared/directivas/boton.directive';
import { ProductoApiService } from '../../acceso-datos/producto-api.service';
import { Producto } from '../../modelos/producto.model';

@Component({
  selector: 'app-pagina-detalle-producto',
  imports: [CurrencyPipe, ReactiveFormsModule, RouterLink, BotonDirective],
  templateUrl: './pagina-detalle-producto.html',
  styleUrl: './pagina-detalle-producto.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  readonly mensajeCarrito = signal<string | null>(null);
  readonly indiceImagenActiva = signal(0);
  readonly cantidadSeleccionada = signal(1);
  readonly notaPersonalizacion = new FormControl('', {
    nonNullable: true,
    validators: [Validators.maxLength(1000)],
  });

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

  readonly disponible = computed(() => {
    const productoActual = this.producto();
    return Boolean(productoActual?.disponible && productoActual.stock > 0);
  });

  readonly stockTexto = computed(() => {
    const productoActual = this.producto();
    if (!productoActual) return '';
    if (!this.disponible()) return 'Agotado temporalmente';
    if (productoActual.stock <= 5) return `Últimas ${productoActual.stock} unidades`;
    return `${productoActual.stock} unidades disponibles`;
  });

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        tap(() => {
          this.cargandoProducto.set(true);
          this.mensajeError.set(null);
          this.mensajeCarrito.set(null);
          this.producto.set(null);
          this.indiceImagenActiva.set(0);
          this.cantidadSeleccionada.set(1);
          this.notaPersonalizacion.reset('');
        }),
        switchMap((parametros) => {
          const idProducto = Number(parametros.get('idProducto'));

          if (!Number.isInteger(idProducto) || idProducto <= 0) {
            this.router.navigateByUrl('/catalogo');
            return EMPTY;
          }

          return this.productoApiService.obtenerProductoPorId(idProducto).pipe(
            tap((producto) => this.producto.set(producto)),
            catchError((error: unknown) => {
              this.mensajeError.set(
                obtenerMensajeErrorUsuario(error, 'No pudimos cargar el detalle del producto.'),
              );
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
    const totalImagenes = this.producto()?.imagenes.length ?? 0;
    if (indice < 0 || indice >= totalImagenes) return;
    this.indiceImagenActiva.set(indice);
  }

  usarImagenAlternativa(evento: Event): void {
    const imagen = evento.currentTarget as HTMLImageElement;
    if (imagen.src.endsWith('/assets/brand/producto-fallback.svg')) return;
    imagen.src = '/assets/brand/producto-fallback.svg';
  }

  disminuirCantidad(producto: Producto): void {
    this.actualizarCantidad(producto, this.cantidadSeleccionada() - 1);
  }

  aumentarCantidad(producto: Producto): void {
    this.actualizarCantidad(producto, this.cantidadSeleccionada() + 1);
  }

  agregarAlCarrito(producto: Producto): void {
    if (!this.disponible() || this.notaPersonalizacion.invalid) {
      this.notaPersonalizacion.markAsTouched();
      return;
    }

    this.carritoCheckout.agregarProducto(producto, this.cantidadSeleccionada());
    this.carritoCheckout.actualizarObservacion(
      producto.idProducto,
      this.notaPersonalizacion.value.trim(),
    );
    this.mensajeCarrito.set(
      `${this.cantidadSeleccionada()} ${this.cantidadSeleccionada() === 1 ? 'unidad agregada' : 'unidades agregadas'} al carrito.`,
    );
  }

  private actualizarCantidad(producto: Producto, cantidad: number): void {
    // El frontend limita la selección para UX; stock y precio se validan otra vez en backend.
    const cantidadSegura = Math.max(1, Math.min(cantidad, producto.stock));
    this.cantidadSeleccionada.set(cantidadSegura);
  }
}
