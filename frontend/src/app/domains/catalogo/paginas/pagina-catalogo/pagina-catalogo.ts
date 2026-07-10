import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { BotonDirective } from '../../../../shared/directivas/boton.directive';
import { TarjetaProducto } from '../../componentes/tarjeta-producto/tarjeta-producto';
import { ProductoApiService } from '../../acceso-datos/producto-api.service';
import { Producto } from '../../modelos/producto.model';

type OrdenCatalogo = 'relevancia' | 'precio-menor' | 'precio-mayor' | 'stock';

@Component({
  selector: 'app-pagina-catalogo',
  imports: [FormsModule, BotonDirective, TarjetaProducto],
  templateUrl: './pagina-catalogo.html',
  styleUrl: './pagina-catalogo.css',
})
export class PaginaCatalogo implements OnInit {
  private readonly productoApiService = inject(ProductoApiService);
  private readonly rutaActiva = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly productos = signal<Producto[]>([]);
  readonly cargandoProductos = signal(true);
  readonly mensajeError = signal<string | null>(null);
  readonly terminoBusqueda = signal('');
  readonly tipoSeleccionado = signal('todos');
  readonly ordenSeleccionado = signal<OrdenCatalogo>('relevancia');

  readonly tiposProducto = computed(() => {
    const tipos = this.productos().map((producto) => producto.tipoProducto).filter(Boolean);
    return Array.from(new Set(tipos)).sort((actual, siguiente) => actual.localeCompare(siguiente));
  });

  readonly productosFiltrados = computed(() => {
    const termino = this.normalizarTexto(this.terminoBusqueda());
    const tipo = this.tipoSeleccionado();
    const orden = this.ordenSeleccionado();

    const productos = this.productos().filter((producto) => {
      const coincideTipo = tipo === 'todos' || producto.tipoProducto === tipo;
      const coincideBusqueda =
        !termino ||
        this.normalizarTexto(producto.nombre).includes(termino) ||
        this.normalizarTexto(producto.descripcion).includes(termino) ||
        this.normalizarTexto(producto.nombreTienda).includes(termino);

      return coincideTipo && coincideBusqueda;
    });

    // Ordenamiento local: el backend sigue siendo la fuente de datos, el frontend solo ordena la vista.
    return [...productos].sort((actual, siguiente) => {
      if (orden === 'precio-menor') return actual.precio - siguiente.precio;
      if (orden === 'precio-mayor') return siguiente.precio - actual.precio;
      if (orden === 'stock') return siguiente.stock - actual.stock;
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
  }

  cargarProductos(): void {
    this.cargandoProductos.set(true);
    this.mensajeError.set(null);

    this.productoApiService
      .obtenerProductos()
      .pipe(finalize(() => this.cargandoProductos.set(false)))
      .subscribe({
        next: (productos) => this.productos.set(productos),
        error: (error: Error) => this.mensajeError.set(this.obtenerMensajeErrorCatalogo(error)),
      });
  }

  actualizarBusqueda(termino: string): void {
    this.terminoBusqueda.set(termino);
  }

  actualizarTipo(tipo: string): void {
    this.tipoSeleccionado.set(tipo);
  }

  actualizarOrden(orden: OrdenCatalogo): void {
    this.ordenSeleccionado.set(orden);
  }

  limpiarFiltros(): void {
    this.terminoBusqueda.set('');
    this.tipoSeleccionado.set('todos');
    this.ordenSeleccionado.set('relevancia');
  }

  identificarProducto(_indice: number, producto: Producto): number {
    return producto.idProducto;
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
      ? 'No pudimos conectar con el backend de REGALIA para cargar los productos.'
      : mensaje || 'No pudimos cargar el catalogo. Verifica que el backend este activo.';
  }
}
