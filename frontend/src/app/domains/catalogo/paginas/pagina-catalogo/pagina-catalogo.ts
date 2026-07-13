import {
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { CarritoCheckoutService } from '../../../../core/carrito/carrito-checkout.service';
import { obtenerMensajeErrorUsuario } from '../../../../core/http/modelos/error-api.model';
import { TiendaPublicaApiService } from '../../../tiendas/acceso-datos/tienda-publica-api.service';
import { ProductoApiService } from '../../acceso-datos/producto-api.service';
import { FiltrosCatalogo } from '../../componentes/filtros-catalogo/filtros-catalogo';
import { HeroCatalogo } from '../../componentes/hero-catalogo/hero-catalogo';
import { ResultadosCatalogo } from '../../componentes/resultados-catalogo/resultados-catalogo';
import { TiendasCatalogo } from '../../componentes/tiendas-catalogo/tiendas-catalogo';
import { OrdenCatalogo } from '../../modelos/catalogo-ui.model';
import { Producto } from '../../modelos/producto.model';
import { TiendaPublica } from '../../../tiendas/modelos/tienda-publica.model';

@Component({
  selector: 'app-pagina-catalogo',
  imports: [FiltrosCatalogo, HeroCatalogo, ResultadosCatalogo, TiendasCatalogo],
  templateUrl: './pagina-catalogo.html',
  styleUrl: './pagina-catalogo.css',
  // Las clases catalog-* son propias del dominio; se comparten con componentes internos del catalogo.
  encapsulation: ViewEncapsulation.None,
})
export class PaginaCatalogo implements OnInit {
  private readonly productoApiService = inject(ProductoApiService);
  private readonly tiendaPublicaApiService = inject(TiendaPublicaApiService);
  private readonly carritoCheckout = inject(CarritoCheckoutService);
  private readonly rutaActiva = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly productos = signal<Producto[]>([]);
  readonly tiendas = signal<TiendaPublica[]>([]);
  readonly cargandoProductos = signal(true);
  readonly cargandoTiendas = signal(true);
  readonly mensajeErrorProductos = signal<string | null>(null);
  readonly mensajeErrorTiendas = signal<string | null>(null);
  readonly terminoBusqueda = signal('');
  readonly tipoSeleccionado = signal('Todas');
  readonly precioMaximo = signal(300);
  readonly soloDisponibles = signal(true);
  readonly ordenSeleccionado = signal<OrdenCatalogo>('recommended');

  readonly categorias = computed(() => {
    const tipos = this.productos().map((producto) => producto.tipoProducto).filter(Boolean);
    return ['Todas', ...Array.from(new Set(tipos))];
  });

  readonly productosFiltrados = computed(() => {
    const termino = this.normalizarTexto(this.terminoBusqueda());
    const tipo = this.tipoSeleccionado();
    const precioMaximo = this.precioMaximo();
    const soloDisponibles = this.soloDisponibles();

    const productos = this.productos().filter((producto) => {
      const textoProducto = this.normalizarTexto(
        `${producto.nombre} ${producto.descripcion} ${producto.nombreTienda} ${producto.tipoProducto}`,
      );
      const coincideBusqueda = !termino || textoProducto.includes(termino);
      const coincideTipo = tipo === 'Todas' || producto.tipoProducto === tipo;
      const coincidePrecio = producto.precio <= precioMaximo;
      const coincideDisponibilidad = !soloDisponibles || producto.disponible;

      return coincideBusqueda && coincideTipo && coincidePrecio && coincideDisponibilidad;
    });

    return [...productos].sort((actual, siguiente) => {
      if (this.ordenSeleccionado() === 'priceAsc') return actual.precio - siguiente.precio;
      if (this.ordenSeleccionado() === 'priceDesc') return siguiente.precio - actual.precio;
      return Number(siguiente.disponible) - Number(actual.disponible);
    });
  });

  readonly productosDisponibles = computed(
    () => this.productos().filter((producto) => producto.disponible).length,
  );

  ngOnInit(): void {
    this.rutaActiva.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((parametros) => {
      this.terminoBusqueda.set(parametros.get('busqueda') ?? '');
    });

    this.cargarProductos();
    this.cargarTiendas();
  }

  cargarProductos(): void {
    this.cargandoProductos.set(true);
    this.mensajeErrorProductos.set(null);

    this.productoApiService
      .obtenerProductos()
      .pipe(finalize(() => this.cargandoProductos.set(false)))
      .subscribe({
        next: (productos) => this.productos.set(productos),
        error: (error: unknown) => {
          this.productos.set([]);
          this.mensajeErrorProductos.set(this.obtenerMensajeErrorCatalogo(error));
        },
      });
  }

  cargarTiendas(): void {
    this.cargandoTiendas.set(true);
    this.mensajeErrorTiendas.set(null);

    this.tiendaPublicaApiService
      .obtenerTiendasPublicas()
      .pipe(finalize(() => this.cargandoTiendas.set(false)))
      .subscribe({
        next: (tiendas) => this.tiendas.set(tiendas),
        error: (error: unknown) => {
          this.tiendas.set([]);
          this.mensajeErrorTiendas.set(this.obtenerMensajeErrorTiendas(error));
        },
      });
  }

  actualizarBusqueda(termino: string): void {
    this.terminoBusqueda.set(termino);
  }

  actualizarTipo(tipo: string): void {
    this.tipoSeleccionado.set(tipo);
  }

  actualizarPrecioMaximo(precio: number | string): void {
    this.precioMaximo.set(Number(precio));
  }

  actualizarOrden(orden: OrdenCatalogo): void {
    this.ordenSeleccionado.set(orden);
  }

  actualizarDisponibilidad(soloDisponibles: boolean): void {
    this.soloDisponibles.set(soloDisponibles);
  }

  limpiarFiltros(): void {
    this.terminoBusqueda.set('');
    this.tipoSeleccionado.set('Todas');
    this.precioMaximo.set(300);
    this.soloDisponibles.set(true);
    this.ordenSeleccionado.set('recommended');
  }

  agregarAlCarrito(producto: Producto): void {
    if (!producto.disponible || producto.stock <= 0) return;
    this.carritoCheckout.agregarProducto(producto);
  }

  private normalizarTexto(valor: string): string {
    return valor
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  }

  private obtenerMensajeErrorCatalogo(error: unknown): string {
    return obtenerMensajeErrorUsuario(error, 'No pudimos cargar el catalogo real.');
  }

  private obtenerMensajeErrorTiendas(error: unknown): string {
    return obtenerMensajeErrorUsuario(error, 'No pudimos cargar las tiendas publicas.');
  }
}
