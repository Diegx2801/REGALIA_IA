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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, EMPTY, finalize, forkJoin, switchMap, tap } from 'rxjs';
import { CarritoCheckoutService } from '../../../../core/carrito/carrito-checkout.service';
import { obtenerMensajeErrorUsuario } from '../../../../core/http/modelos/error-api.model';
import { TiendaPublicaApiService } from '../../../tiendas/acceso-datos/tienda-publica-api.service';
import { TiendaPublica } from '../../../tiendas/modelos/tienda-publica.model';
import { ProductoApiService } from '../../acceso-datos/producto-api.service';
import { TarjetaProducto } from '../../componentes/tarjeta-producto/tarjeta-producto';
import { Producto } from '../../modelos/producto.model';

@Component({
  selector: 'app-pagina-detalle-tienda',
  imports: [RouterLink, TarjetaProducto],
  templateUrl: './pagina-detalle-tienda.html',
  styleUrl: './pagina-detalle-tienda.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaDetalleTienda implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly tiendaApi = inject(TiendaPublicaApiService);
  private readonly productoApi = inject(ProductoApiService);
  private readonly carrito = inject(CarritoCheckoutService);

  readonly tienda = signal<TiendaPublica | null>(null);
  readonly productos = signal<Producto[]>([]);
  readonly cargando = signal(true);
  readonly mensajeError = signal<string | null>(null);
  readonly mensajeCarrito = signal<string | null>(null);
  readonly productosDisponibles = computed(() =>
    this.productos().filter((producto) => producto.disponible && producto.stock > 0),
  );
  readonly iniciales = computed(() =>
    (this.tienda()?.nombre ?? 'REGALIA')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((palabra) => palabra.charAt(0))
      .join('')
      .toUpperCase(),
  );

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        tap(() => {
          this.cargando.set(true);
          this.mensajeError.set(null);
          this.mensajeCarrito.set(null);
          this.tienda.set(null);
          this.productos.set([]);
        }),
        switchMap((parametros) => {
          const idTienda = Number(parametros.get('idTienda'));

          if (!Number.isInteger(idTienda) || idTienda <= 0) {
            void this.router.navigateByUrl('/catalogo');
            return EMPTY;
          }

          return forkJoin({
            tienda: this.tiendaApi.obtenerTiendaPublicaPorId(idTienda),
            productos: this.productoApi.obtenerProductosPorTienda(idTienda),
          }).pipe(
            tap(({ tienda, productos }) => {
              this.tienda.set(tienda);
              this.productos.set(productos);
            }),
            catchError((error: unknown) => {
              this.mensajeError.set(
                obtenerMensajeErrorUsuario(error, 'No pudimos cargar esta tienda.'),
              );
              return EMPTY;
            }),
            finalize(() => this.cargando.set(false)),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  agregarAlCarrito(producto: Producto): void {
    if (!this.carrito.agregarProducto(producto)) return;
    this.mensajeCarrito.set(`${producto.nombre} se agregó a tu carrito.`);
  }
}
