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
import { catchError, finalize, map, of, startWith, Subject, switchMap, tap } from 'rxjs';
import { CarritoCheckoutService } from '../../../../core/carrito/carrito-checkout.service';
import { obtenerMensajeErrorUsuario } from '../../../../core/http/modelos/error-api.model';
import { RespuestaPaginada } from '../../../../shared/modelos/respuesta-api.model';
import { TipoProductoApiService } from '../../../datos-maestros/acceso-datos/tipo-producto-api.service';
import { TipoProducto } from '../../../datos-maestros/modelos/tipo-producto.model';
import { TiendaPublicaApiService } from '../../../tiendas/acceso-datos/tienda-publica-api.service';
import {
  ConsultaProductosCatalogo,
  ProductoApiService,
} from '../../acceso-datos/producto-api.service';
import { FiltrosCatalogo } from '../../componentes/filtros-catalogo/filtros-catalogo';
import { HeroCatalogo } from '../../componentes/hero-catalogo/hero-catalogo';
import { ResultadosCatalogo } from '../../componentes/resultados-catalogo/resultados-catalogo';
import { TiendasCatalogo } from '../../componentes/tiendas-catalogo/tiendas-catalogo';
import { OrdenCatalogo } from '../../modelos/catalogo-ui.model';
import { Producto } from '../../modelos/producto.model';
import { TiendaPublica } from '../../../tiendas/modelos/tienda-publica.model';

interface ResultadoCargaProductos {
  readonly pagina: RespuestaPaginada<Producto> | null;
  readonly error: unknown | null;
}

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
  private readonly tipoProductoApiService = inject(TipoProductoApiService);
  private readonly tiendaPublicaApiService = inject(TiendaPublicaApiService);
  private readonly carritoCheckout = inject(CarritoCheckoutService);
  private readonly rutaActiva = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly solicitudesProductos = new Subject<void>();

  readonly productos = signal<Producto[]>([]);
  readonly tiposProducto = signal<TipoProducto[]>([]);
  readonly tiendas = signal<TiendaPublica[]>([]);
  readonly totalProductos = signal(0);
  readonly paginaActual = signal(0);
  readonly totalPaginas = signal(0);
  readonly cargandoProductos = signal(true);
  readonly cargandoTiendas = signal(true);
  readonly mensajeErrorProductos = signal<string | null>(null);
  readonly mensajeErrorTiendas = signal<string | null>(null);
  readonly terminoBusqueda = signal('');
  readonly tipoSeleccionado = signal('Todas');
  readonly precioMaximo = signal(300);
  readonly soloDisponibles = signal(true);
  readonly ordenSeleccionado = signal<OrdenCatalogo>('recommended');

  readonly categorias = computed(() => [
    'Todas',
    ...this.tiposProducto().map((tipoProducto) => tipoProducto.nombre),
  ]);

  ngOnInit(): void {
    this.terminoBusqueda.set(this.rutaActiva.snapshot.queryParamMap.get('busqueda') ?? '');
    this.configurarCargaProductos();
    this.cargarTiposProducto();
    this.cargarTiendas();
  }

  cargarProductos(): void {
    this.solicitudesProductos.next();
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
    const busqueda = termino.trim();
    if (busqueda === this.terminoBusqueda()) return;

    this.terminoBusqueda.set(busqueda);
    this.reiniciarPaginaYCargar();
  }

  actualizarTipo(tipo: string): void {
    if (tipo === this.tipoSeleccionado()) return;

    this.tipoSeleccionado.set(tipo);
    this.reiniciarPaginaYCargar();
  }

  actualizarPrecioMaximo(precio: number | string): void {
    const precioNormalizado = Number(precio);
    if (!Number.isFinite(precioNormalizado) || precioNormalizado <= 0) return;
    if (precioNormalizado === this.precioMaximo()) return;

    this.precioMaximo.set(precioNormalizado);
    this.reiniciarPaginaYCargar();
  }

  actualizarOrden(orden: OrdenCatalogo): void {
    if (orden === this.ordenSeleccionado()) return;

    this.ordenSeleccionado.set(orden);
    this.reiniciarPaginaYCargar();
  }

  actualizarDisponibilidad(soloDisponibles: boolean): void {
    if (soloDisponibles === this.soloDisponibles()) return;

    this.soloDisponibles.set(soloDisponibles);
    this.reiniciarPaginaYCargar();
  }

  limpiarFiltros(): void {
    this.terminoBusqueda.set('');
    this.tipoSeleccionado.set('Todas');
    this.precioMaximo.set(300);
    this.soloDisponibles.set(true);
    this.ordenSeleccionado.set('recommended');
    this.reiniciarPaginaYCargar();
  }

  paginaAnterior(): void {
    if (this.paginaActual() === 0) return;
    this.paginaActual.update((pagina) => pagina - 1);
    this.cargarProductos();
  }

  paginaSiguiente(): void {
    if (this.paginaActual() + 1 >= this.totalPaginas()) return;
    this.paginaActual.update((pagina) => pagina + 1);
    this.cargarProductos();
  }

  agregarAlCarrito(producto: Producto): void {
    if (!producto.disponible || producto.stock <= 0) return;
    this.carritoCheckout.agregarProducto(producto);
  }

  private configurarCargaProductos(): void {
    this.solicitudesProductos
      .pipe(
        startWith(undefined),
        tap(() => {
          this.cargandoProductos.set(true);
          this.mensajeErrorProductos.set(null);
        }),
        switchMap(() =>
          this.productoApiService.obtenerProductos(this.crearConsultaProductos()).pipe(
            map(
              (pagina): ResultadoCargaProductos => ({
                pagina,
                error: null,
              }),
            ),
            catchError((error: unknown) =>
              of<ResultadoCargaProductos>({
                pagina: null,
                error,
              }),
            ),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((resultado) => {
        this.cargandoProductos.set(false);

        if (resultado.error || !resultado.pagina) {
          this.productos.set([]);
          this.totalProductos.set(0);
          this.totalPaginas.set(0);
          this.mensajeErrorProductos.set(this.obtenerMensajeErrorCatalogo(resultado.error));
          return;
        }

        this.actualizarPagina(resultado.pagina);
      });
  }

  private cargarTiposProducto(): void {
    this.tipoProductoApiService
      .obtenerTiposProducto()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (tiposProducto) => this.tiposProducto.set(tiposProducto),
        error: () => this.tiposProducto.set([]),
      });
  }

  private reiniciarPaginaYCargar(): void {
    this.paginaActual.set(0);
    this.cargarProductos();
  }

  private crearConsultaProductos(): ConsultaProductosCatalogo {
    const tipoProducto = this.tiposProducto().find(
      (tipo) => tipo.nombre === this.tipoSeleccionado(),
    );

    return {
      page: this.paginaActual(),
      size: 12,
      search: this.terminoBusqueda(),
      idTipoProducto: tipoProducto?.idTipoProducto ?? null,
      precioMaximo: this.precioMaximo(),
      soloDisponibles: this.soloDisponibles(),
      orden: this.ordenSeleccionado(),
    };
  }

  private actualizarPagina(pagina: RespuestaPaginada<Producto>): void {
    this.productos.set(pagina.contenido);
    this.paginaActual.set(pagina.paginaActual);
    this.totalProductos.set(pagina.totalElementos);
    this.totalPaginas.set(pagina.totalPaginas);
  }

  private obtenerMensajeErrorCatalogo(error: unknown): string {
    return obtenerMensajeErrorUsuario(error, 'No pudimos cargar el catalogo real.');
  }

  private obtenerMensajeErrorTiendas(error: unknown): string {
    return obtenerMensajeErrorUsuario(error, 'No pudimos cargar las tiendas publicas.');
  }
}
