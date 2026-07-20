import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { CarritoCheckoutService } from '../../../core/carrito/carrito-checkout.service';
import { obtenerMensajeErrorUsuario } from '../../../core/http/modelos/error-api.model';
import { ProductoApiService } from '../../../domains/catalogo/acceso-datos/producto-api.service';
import { Producto } from '../../../domains/catalogo/modelos/producto.model';
import { TipoProductoApiService } from '../../../domains/datos-maestros/acceso-datos/tipo-producto-api.service';
import { TipoProducto } from '../../../domains/datos-maestros/modelos/tipo-producto.model';
import { TiendaPublicaApiService } from '../../../domains/tiendas/acceso-datos/tienda-publica-api.service';
import { TiendaPublica } from '../../../domains/tiendas/modelos/tienda-publica.model';
import { CalendarioComercial } from '../componentes/calendario-comercial/calendario-comercial';
import { CtaVendedorInicio } from '../componentes/cta-vendedor-inicio/cta-vendedor-inicio';
import { DestacadosInicio } from '../componentes/destacados-inicio/destacados-inicio';
import { HeroInicio } from '../componentes/hero-inicio/hero-inicio';
import { ModeloNegocioInicio } from '../componentes/modelo-negocio-inicio/modelo-negocio-inicio';
import { CampanaComercial, PasoModeloNegocio } from '../modelos/inicio.model';

@Component({
  selector: 'app-pagina-inicio',
  imports: [
    CalendarioComercial,
    CtaVendedorInicio,
    DestacadosInicio,
    HeroInicio,
    ModeloNegocioInicio,
  ],
  templateUrl: './pagina-inicio.html',
  styleUrl: './pagina-inicio.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Las clases landing-* se comparten únicamente con los componentes internos de esta página.
  encapsulation: ViewEncapsulation.None,
})
export class PaginaInicio implements AfterViewInit, OnInit {
  private readonly router = inject(Router);
  private readonly productoApiService = inject(ProductoApiService);
  private readonly tipoProductoApiService = inject(TipoProductoApiService);
  private readonly tiendaPublicaApiService = inject(TiendaPublicaApiService);
  private readonly carritoCheckout = inject(CarritoCheckoutService);
  private readonly destroyRef = inject(DestroyRef);

  readonly controlBusqueda = new FormControl('', { nonNullable: true });
  readonly mesActivo = signal('FEB');

  readonly categorias = signal<TipoProducto[]>([]);
  readonly tiendasDestacadas = signal<TiendaPublica[]>([]);
  readonly productosDestacados = signal<Producto[]>([]);

  readonly cargandoCategorias = signal(true);
  readonly cargandoTiendasDestacadas = signal(true);
  readonly cargandoProductosDestacados = signal(true);

  readonly mensajeErrorCategorias = signal<string | null>(null);
  readonly mensajeErrorTiendasDestacadas = signal<string | null>(null);
  readonly mensajeErrorProductosDestacados = signal<string | null>(null);
  readonly mensajeCarrito = signal<string | null>(null);

  readonly meses = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
  readonly diasSemana = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'];
  readonly diasFebrero = Array.from({ length: 28 }, (_, indice) => indice + 1);

  readonly campanas: readonly CampanaComercial[] = [
    {
      fecha: '14 FEB',
      titulo: 'San Valentín',
      descripcion: 'Flores y detalles románticos',
      sugerencias: ['Ramos premium', 'Box romántico', 'Torta mini'],
    },
    {
      fecha: '08 MAR',
      titulo: 'Día de la Mujer',
      descripcion: 'Experiencias delicadas y mensajes memorables',
      sugerencias: ['Box floral', 'Carta premium', 'Chocolate artesanal'],
    },
    {
      fecha: '2DO MAY',
      titulo: 'Día de la Madre',
      descripcion: 'Sorpresas elegantes para agradecer con estilo',
      sugerencias: ['Desayuno sorpresa', 'Arreglo floral', 'Taza personalizada'],
    },
    {
      fecha: '3ER JUN',
      titulo: 'Día del Padre',
      descripcion: 'Regalos sobrios, útiles y con personalidad',
      sugerencias: ['Kit ejecutivo', 'Box gourmet', 'Agenda personalizada'],
    },
    {
      fecha: '31 OCT',
      titulo: 'Halloween',
      descripcion: 'Campañas temáticas para marcas y celebraciones',
      sugerencias: ['Candy box', 'Mini cake', 'Pack temático'],
    },
    {
      fecha: '25 DIC',
      titulo: 'Navidad',
      descripcion: 'Temporada alta para detalles familiares y corporativos',
      sugerencias: ['Canasta premium', 'Gift box', 'Vino y chocolates'],
    },
  ];

  readonly pasosModeloNegocio: readonly PasoModeloNegocio[] = [
    { numero: '01', descripcion: 'Describe la ocasión, el estilo y tu presupuesto.' },
    { numero: '02', descripcion: 'Compara productos disponibles de tiendas aprobadas.' },
    { numero: '03', descripcion: 'Personaliza el detalle y confirma las condiciones de entrega.' },
    { numero: '04', descripcion: 'Reserva de forma segura y sigue tu pedido desde REGALIA.' },
  ];

  ngAfterViewInit(): void {
    if (this.router.url.startsWith('/modelo')) {
      setTimeout(() => document.querySelector('#modelo')?.scrollIntoView({ behavior: 'smooth' }));
    }
  }

  ngOnInit(): void {
    this.cargarCategorias();
    this.cargarTiendasDestacadas();
    this.cargarProductosDestacados();
  }

  buscarRegalos(): void {
    const busqueda = this.controlBusqueda.value.trim();
    void this.router.navigate(['/catalogo'], {
      queryParams: busqueda ? { busqueda } : undefined,
    });
  }

  buscarCategoria(categoria: TipoProducto): void {
    void this.router.navigate(['/catalogo'], {
      queryParams: { busqueda: categoria.nombre },
    });
  }

  explorarTienda(tienda: TiendaPublica): void {
    void this.router.navigate(['/catalogo'], {
      queryParams: { busqueda: tienda.nombre },
    });
  }

  agregarAlCarrito(producto: Producto): void {
    if (!producto.disponible || producto.stock <= 0) return;

    this.carritoCheckout.agregarProducto(producto);
    this.mensajeCarrito.set(`${producto.nombre} se agregó a tu carrito.`);
  }

  cargarCategorias(): void {
    this.cargandoCategorias.set(true);
    this.mensajeErrorCategorias.set(null);

    this.tipoProductoApiService
      .obtenerTiposProducto()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.cargandoCategorias.set(false)),
      )
      .subscribe({
        next: (categorias) => this.categorias.set(categorias.filter((categoria) => categoria.estado)),
        error: (error: unknown) => {
          this.categorias.set([]);
          this.mensajeErrorCategorias.set(
            obtenerMensajeErrorUsuario(error, 'No pudimos cargar las categorías.'),
          );
        },
      });
  }

  cargarTiendasDestacadas(): void {
    this.cargandoTiendasDestacadas.set(true);
    this.mensajeErrorTiendasDestacadas.set(null);

    this.tiendaPublicaApiService
      .obtenerTiendasPublicas()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.cargandoTiendasDestacadas.set(false)),
      )
      .subscribe({
        next: (tiendas) => this.tiendasDestacadas.set(tiendas.slice(0, 4)),
        error: (error: unknown) => {
          this.tiendasDestacadas.set([]);
          this.mensajeErrorTiendasDestacadas.set(
            obtenerMensajeErrorUsuario(error, 'No pudimos cargar las tiendas destacadas.'),
          );
        },
      });
  }

  cargarProductosDestacados(): void {
    this.cargandoProductosDestacados.set(true);
    this.mensajeErrorProductosDestacados.set(null);

    this.productoApiService
      .obtenerProductos({ size: 8, soloDisponibles: true })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.cargandoProductosDestacados.set(false)),
      )
      .subscribe({
        next: (pagina) => this.productosDestacados.set(pagina.contenido),
        error: (error: unknown) => {
          this.productosDestacados.set([]);
          this.mensajeErrorProductosDestacados.set(
            obtenerMensajeErrorUsuario(error, 'No pudimos cargar los productos destacados.'),
          );
        },
      });
  }
}
