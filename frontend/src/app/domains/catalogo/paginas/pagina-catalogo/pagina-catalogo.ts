import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, map, of, Subject, switchMap, tap } from 'rxjs';
import { CarritoCheckoutService } from '../../../../core/carrito/carrito-checkout.service';
import { obtenerMensajeErrorUsuario } from '../../../../core/http/modelos/error-api.model';
import { RespuestaPaginada } from '../../../../shared/modelos/respuesta-api.model';
import { TipoProductoApiService } from '../../../datos-maestros/acceso-datos/tipo-producto-api.service';
import { TipoProducto } from '../../../datos-maestros/modelos/tipo-producto.model';
import { TiendaPublicaApiService } from '../../../tiendas/acceso-datos/tienda-publica-api.service';
import { TiendaPublica } from '../../../tiendas/modelos/tienda-publica.model';
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

interface ResultadoCargaProductos {
  readonly pagina: RespuestaPaginada<Producto> | null;
  readonly error: unknown | null;
}

@Component({
  selector: 'app-pagina-catalogo',
  imports: [FiltrosCatalogo, HeroCatalogo, ResultadosCatalogo, TiendasCatalogo],
  templateUrl: './pagina-catalogo.html',
  styleUrl: './pagina-catalogo.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Los componentes internos comparten las clases catalog-* de esta experiencia.
  encapsulation: ViewEncapsulation.None,
})
export class PaginaCatalogo implements OnInit {
  private readonly productoApiService = inject(ProductoApiService);
  private readonly tipoProductoApiService = inject(TipoProductoApiService);
  private readonly tiendaPublicaApiService = inject(TiendaPublicaApiService);
  private readonly carritoCheckout = inject(CarritoCheckoutService);
  private readonly rutaActiva = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly solicitudesProductos = new Subject<void>();
  private catalogoInicializado = false;

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
  readonly mensajeCarrito = signal<string | null>(null);
  readonly terminoBusqueda = signal('');
  readonly tipoSeleccionado = signal('Todas');
  readonly precioMaximo = signal(300);
  readonly soloDisponibles = signal(true);
  readonly ordenSeleccionado = signal<OrdenCatalogo>('recommended');
  readonly filtrosMovilesAbiertos = signal(false);

  readonly categorias = computed(() => [
    'Todas',
    ...this.tiposProducto().map((tipoProducto) => tipoProducto.nombre),
  ]);
  readonly cantidadFiltrosActivos = computed(
    () =>
      Number(Boolean(this.terminoBusqueda())) +
      Number(this.tipoSeleccionado() !== 'Todas') +
      Number(this.precioMaximo() !== 300) +
      Number(!this.soloDisponibles()),
  );

  ngOnInit(): void {
    this.configurarCargaProductos();
    this.suscribirFiltrosUrl();
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
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (tiendas) => {
          this.tiendas.set(tiendas);
          this.cargandoTiendas.set(false);
        },
        error: (error: unknown) => {
          this.tiendas.set([]);
          this.cargandoTiendas.set(false);
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
    this.filtrosMovilesAbiertos.set(false);
    this.reiniciarPaginaYCargar();
  }

  paginaAnterior(): void {
    if (this.paginaActual() === 0) return;
    this.paginaActual.update((pagina) => pagina - 1);
    this.sincronizarFiltrosEnUrl();
    this.cargarProductos();
  }

  paginaSiguiente(): void {
    if (this.paginaActual() + 1 >= this.totalPaginas()) return;
    this.paginaActual.update((pagina) => pagina + 1);
    this.sincronizarFiltrosEnUrl();
    this.cargarProductos();
  }

  agregarAlCarrito(producto: Producto): void {
    if (!producto.disponible || producto.stock <= 0) return;
    this.carritoCheckout.agregarProducto(producto);
    this.mensajeCarrito.set(`${producto.nombre} se agregó a tu carrito.`);
  }

  alternarFiltrosMoviles(): void {
    this.filtrosMovilesAbiertos.update((abiertos) => !abiertos);
  }

  private suscribirFiltrosUrl(): void {
    this.rutaActiva.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((parametros) => {
        const filtrosCambiaron = this.aplicarFiltrosUrl(parametros);
        if (this.catalogoInicializado && filtrosCambiaron) this.cargarProductos();
      });
  }

  private aplicarFiltrosUrl(parametros: import('@angular/router').ParamMap): boolean {
    const precio = Number(parametros.get('precioMaximo'));
    const pagina = Number(parametros.get('pagina'));
    const orden = parametros.get('orden');
    const busquedaUrl = parametros.get('busqueda')?.trim() ?? '';
    const tipoUrl = parametros.get('tipo')?.trim() || 'Todas';
    const precioUrl = Number.isFinite(precio) && precio > 0 ? precio : 300;
    const paginaUrl = Number.isInteger(pagina) && pagina > 0 ? pagina - 1 : 0;
    const disponiblesUrl = parametros.get('disponibles') !== 'false';
    const ordenUrl = this.esOrdenCatalogo(orden) ? orden : 'recommended';
    const filtrosCambiaron =
      busquedaUrl !== this.terminoBusqueda() ||
      tipoUrl !== this.tipoSeleccionado() ||
      precioUrl !== this.precioMaximo() ||
      paginaUrl !== this.paginaActual() ||
      disponiblesUrl !== this.soloDisponibles() ||
      ordenUrl !== this.ordenSeleccionado();

    this.terminoBusqueda.set(busquedaUrl);
    this.tipoSeleccionado.set(tipoUrl);
    this.precioMaximo.set(precioUrl);
    this.paginaActual.set(paginaUrl);
    this.soloDisponibles.set(disponiblesUrl);
    this.ordenSeleccionado.set(ordenUrl);
    this.mensajeCarrito.set(null);
    return filtrosCambiaron;
  }

  private configurarCargaProductos(): void {
    this.solicitudesProductos
      .pipe(
        tap(() => {
          this.cargandoProductos.set(true);
          this.mensajeErrorProductos.set(null);
        }),
        switchMap(() =>
          this.productoApiService.obtenerProductos(this.crearConsultaProductos()).pipe(
            map((pagina): ResultadoCargaProductos => ({ pagina, error: null })),
            catchError((error: unknown) => of<ResultadoCargaProductos>({ pagina: null, error })),
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
        next: (tiposProducto) => {
          this.tiposProducto.set(tiposProducto.filter((tipo) => tipo.estado));
          if (
            this.tipoSeleccionado() !== 'Todas' &&
            !tiposProducto.some((tipo) => tipo.nombre === this.tipoSeleccionado())
          ) {
            this.tipoSeleccionado.set('Todas');
          }
          this.catalogoInicializado = true;
          this.sincronizarFiltrosEnUrl();
          this.cargarProductos();
        },
        error: () => {
          this.tiposProducto.set([]);
          this.tipoSeleccionado.set('Todas');
          this.catalogoInicializado = true;
          this.sincronizarFiltrosEnUrl();
          this.cargarProductos();
        },
      });
  }

  private reiniciarPaginaYCargar(): void {
    this.paginaActual.set(0);
    this.mensajeCarrito.set(null);
    this.sincronizarFiltrosEnUrl();
    this.cargarProductos();
  }

  private sincronizarFiltrosEnUrl(): void {
    void this.router.navigate([], {
      relativeTo: this.rutaActiva,
      replaceUrl: true,
      queryParams: {
        busqueda: this.terminoBusqueda() || null,
        tipo: this.tipoSeleccionado() !== 'Todas' ? this.tipoSeleccionado() : null,
        precioMaximo: this.precioMaximo() !== 300 ? this.precioMaximo() : null,
        disponibles: !this.soloDisponibles() ? false : null,
        orden: this.ordenSeleccionado() !== 'recommended' ? this.ordenSeleccionado() : null,
        pagina: this.paginaActual() > 0 ? this.paginaActual() + 1 : null,
      },
    });
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

  private esOrdenCatalogo(orden: string | null): orden is OrdenCatalogo {
    return orden === 'recommended' || orden === 'priceAsc' || orden === 'priceDesc';
  }

  private obtenerMensajeErrorCatalogo(error: unknown): string {
    return obtenerMensajeErrorUsuario(error, 'No pudimos cargar el catálogo real.');
  }

  private obtenerMensajeErrorTiendas(error: unknown): string {
    return obtenerMensajeErrorUsuario(error, 'No pudimos cargar las tiendas públicas.');
  }
}
