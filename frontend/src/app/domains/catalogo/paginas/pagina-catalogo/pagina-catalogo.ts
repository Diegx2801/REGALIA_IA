import { CurrencyPipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { CarritoCheckoutService } from '../../../../core/carrito/carrito-checkout.service';
import { ProductoApiService } from '../../acceso-datos/producto-api.service';
import { Producto } from '../../modelos/producto.model';

type OrdenCatalogo = 'recommended' | 'priceAsc' | 'priceDesc' | 'ratingDesc';

interface VendedorCatalogo {
  readonly nombre: string;
  readonly categoria: string;
  readonly descripcion: string;
  readonly etiqueta: string;
  readonly calificacion: string;
  readonly ubicacion: string;
  readonly rangoPrecio: string;
  readonly tags: readonly string[];
}

@Component({
  selector: 'app-pagina-catalogo',
  imports: [CurrencyPipe, FormsModule, RouterLink],
  templateUrl: './pagina-catalogo.html',
  styleUrl: './pagina-catalogo.css',
})
export class PaginaCatalogo implements OnInit {
  private readonly productoApiService = inject(ProductoApiService);
  private readonly carritoCheckout = inject(CarritoCheckoutService);
  private readonly rutaActiva = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly productosBackend = signal<Producto[]>([]);
  readonly cargandoProductos = signal(true);
  readonly mensajeError = signal<string | null>(null);
  readonly terminoBusqueda = signal('');
  readonly tipoSeleccionado = signal('Todas');
  readonly ocasionSeleccionada = signal('Todas');
  readonly precioMaximo = signal(300);
  readonly soloDisponibles = signal(true);
  readonly ordenSeleccionado = signal<OrdenCatalogo>('recommended');

  readonly categoriasBase = [
    'Todas',
    'Cajas sorpresa',
    'Arreglos florales',
    'Reposteria personalizada',
    'Manualidades',
    'Sublimados',
    'Decoracion de eventos',
    'Carpinteria personalizada',
    'Servicios creativos',
  ] as const;

  readonly ocasiones = [
    'Todas',
    'Cumpleanos',
    'Dia de la Madre',
    'Aniversario',
    'Graduacion',
    'San Valentin',
    'Navidad',
    'Condolencias',
    'Evento corporativo',
  ] as const;

  readonly vendedores: readonly VendedorCatalogo[] = [
    {
      nombre: 'Dulce Detalle Trujillo',
      categoria: 'Reposteria personalizada',
      descripcion: 'Reposteria fina para regalos personalizados con presentacion cuidada y entrega coordinada.',
      etiqueta: 'Destacado',
      calificacion: '4.9',
      ubicacion: 'Victor Larco - 2.4 km',
      rangoPrecio: 'S/ 65 - 180',
      tags: ['elegante', 'minimalista', 'premium'],
    },
    {
      nombre: 'Caja Bonita',
      categoria: 'Cajas sorpresa',
      descripcion: 'Cajas sorpresa con curaduria local, tarjetas y personalizacion por ocasion.',
      etiqueta: 'Verificado',
      calificacion: '4.7',
      ubicacion: 'California - 3.2 km',
      rangoPrecio: 'S/ 55 - 220',
      tags: ['tierno', 'juvenil', 'colorido'],
    },
    {
      nombre: 'Sublima Norte',
      categoria: 'Sublimados',
      descripcion: 'Sublimados y merchandising personalizado para regalos practicos y campanas locales.',
      etiqueta: 'Verificado',
      calificacion: '4.5',
      ubicacion: 'La Esperanza - 5.1 km',
      rangoPrecio: 'S/ 25 - 140',
      tags: ['corporativo', 'personalizado', 'practico'],
    },
    {
      nombre: 'Momentos Deco',
      categoria: 'Decoracion de eventos',
      descripcion: 'Decoracion para celebraciones pequenas con foco en fotografia, puntualidad y montaje limpio.',
      etiqueta: 'Destacado',
      calificacion: '4.9',
      ubicacion: 'El Golf - 2.9 km',
      rangoPrecio: 'S/ 120 - 650',
      tags: ['premium', 'fotografico', 'elegante'],
    },
  ];

  private readonly productosReferencia: readonly Producto[] = [
    this.crearProductoReferencia(101, 'Box cumpleanos premium', 'Caja lista para cumpleanos con dulces, tarjeta y empaque premium.', 'Cajas sorpresa', 'Caja Bonita', 89, 105),
    this.crearProductoReferencia(102, 'Ramo floral clasico', 'Ramo de flores frescas con tarjeta y coordinacion express.', 'Arreglos florales', 'Floralia Studio', 120),
    this.crearProductoReferencia(103, 'Mini torta personalizada', 'Mini torta con dedicatoria y decoracion segun ocasion.', 'Reposteria personalizada', 'Dulce Detalle Trujillo', 95, 115),
    this.crearProductoReferencia(104, 'Pack taza + llavero sublimado', 'Pack practico con sublimado personalizado para regalos rapidos.', 'Sublimados', 'Sublima Norte', 45),
    this.crearProductoReferencia(105, 'Caja de madera grabada', 'Caja pequena de madera con grabado y acabado artesanal.', 'Carpinteria personalizada', 'Madera & Detalle', 150),
    this.crearProductoReferencia(106, 'Mini setup decorativo', 'Decoracion pequena para mesa, fotos o entrega sorpresa.', 'Decoracion de eventos', 'Momentos Deco', 180),
  ];

  readonly productos = computed(() =>
    this.productosBackend().length > 0 ? this.productosBackend() : [...this.productosReferencia],
  );

  readonly categorias = computed(() => {
    const tipos = this.productos().map((producto) => producto.tipoProducto).filter(Boolean);
    return Array.from(new Set([...this.categoriasBase, ...tipos]));
  });

  readonly productosFiltrados = computed(() => {
    const termino = this.normalizarTexto(this.terminoBusqueda());
    const tipo = this.tipoSeleccionado();
    const ocasion = this.normalizarTexto(this.ocasionSeleccionada());
    const precioMaximo = this.precioMaximo();
    const soloDisponibles = this.soloDisponibles();

    const productos = this.productos().filter((producto) => {
      const textoProducto = this.normalizarTexto(
        `${producto.nombre} ${producto.descripcion} ${producto.nombreTienda} ${producto.tipoProducto}`,
      );
      const coincideBusqueda = !termino || textoProducto.includes(termino);
      const coincideTipo = tipo === 'Todas' || producto.tipoProducto === tipo;
      const coincideOcasion = this.ocasionSeleccionada() === 'Todas' || textoProducto.includes(ocasion);
      const coincidePrecio = producto.precio <= precioMaximo;
      const coincideDisponibilidad = !soloDisponibles || producto.disponible;

      return coincideBusqueda && coincideTipo && coincideOcasion && coincidePrecio && coincideDisponibilidad;
    });

    return [...productos].sort((actual, siguiente) => {
      if (this.ordenSeleccionado() === 'priceAsc') return actual.precio - siguiente.precio;
      if (this.ordenSeleccionado() === 'priceDesc') return siguiente.precio - actual.precio;
      if (this.ordenSeleccionado() === 'ratingDesc') return siguiente.stock - actual.stock;
      return Number(siguiente.disponible) - Number(actual.disponible);
    });
  });

  readonly productosDisponibles = computed(
    () => this.productos().filter((producto) => producto.disponible).length,
  );
  readonly usandoProductosReferencia = computed(
    () => !this.cargandoProductos() && this.productosBackend().length === 0,
  );

  ngOnInit(): void {
    this.rutaActiva.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((parametros) => {
      this.terminoBusqueda.set(parametros.get('busqueda') ?? '');
    });
    this.cargarProductos();
  }

  cargarProductos(): void {
    this.cargandoProductos.set(true);
    this.mensajeError.set(null);

    this.productoApiService
      .obtenerProductos()
      .pipe(finalize(() => this.cargandoProductos.set(false)))
      .subscribe({
        next: (productos) => this.productosBackend.set(productos),
        error: (error: Error) => {
          this.productosBackend.set([]);
          this.mensajeError.set(this.obtenerMensajeErrorCatalogo(error));
        },
      });
  }

  actualizarBusqueda(termino: string): void {
    this.terminoBusqueda.set(termino);
  }

  actualizarTipo(tipo: string): void {
    this.tipoSeleccionado.set(tipo);
  }

  actualizarOcasion(ocasion: string): void {
    this.ocasionSeleccionada.set(ocasion);
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
    this.ocasionSeleccionada.set('Todas');
    this.precioMaximo.set(300);
    this.soloDisponibles.set(true);
    this.ordenSeleccionado.set('recommended');
  }

  agregarAlCarrito(producto: Producto): void {
    if (!producto.disponible || producto.stock <= 0) return;
    this.carritoCheckout.agregarProducto(producto);
  }

  obtenerImagenProducto(producto: Producto): string {
    return producto.imagenes[0]?.urlImagen ?? '/assets/brand/ilustraciones/hero-regalia-home.png';
  }

  obtenerPrecioAnterior(producto: Producto): number | null {
    if (producto.idProducto === 101) return 105;
    if (producto.idProducto === 103) return 115;
    return null;
  }

  obtenerBadgeProducto(indice: number, producto: Producto): string {
    if (!producto.disponible) return 'Agotado';
    return ['Mas reservado', 'Vendedor verificado', 'Top calidad', 'Precio fijo', 'Artesanal', 'Fotografico'][
      indice % 6
    ];
  }

  identificarProducto(_indice: number, producto: Producto): number {
    return producto.idProducto;
  }

  private crearProductoReferencia(
    idProducto: number,
    nombre: string,
    descripcion: string,
    tipoProducto: string,
    nombreTienda: string,
    precio: number,
    precioAnterior?: number,
  ): Producto {
    return {
      idProducto,
      idTienda: idProducto,
      nombreTienda,
      idTipoProducto: idProducto,
      tipoProducto,
      nombre,
      descripcion: precioAnterior ? `${descripcion} Precio anterior S/ ${precioAnterior}.` : descripcion,
      precio,
      stock: 12,
      imagenes: [{ urlImagen: '/assets/brand/ilustraciones/hero-regalia-home.png', orden: 1 }],
      disponible: true,
    };
  }

  private normalizarTexto(valor: string): string {
    return valor
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  }

  private obtenerMensajeErrorCatalogo(error: Error): string {
    const mensaje = error.message ?? '';
    const esErrorTecnico =
      mensaje.includes('Http failure response') ||
      mensaje.includes('Unknown Error') ||
      mensaje.includes('Timeout');

    return esErrorTecnico
      ? 'No pudimos sincronizar el catalogo real. Mostramos productos de referencia mientras el backend vuelve a estar disponible.'
      : mensaje || 'No pudimos cargar el catalogo real.';
  }
}
