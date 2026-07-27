import { CurrencyPipe, NgOptimizedImage } from '@angular/common';
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
import { BotonDirective } from '../../../../shared/directivas/boton.directive';
import { EstadoPantallaComponent } from '../../../../shared/ui/estado-pantalla/estado-pantalla';
import { GrupoMetricasPanelComponent } from '../../../../shared/ui/grupo-metricas-panel/grupo-metricas-panel';
import { InsigniaUi, VarianteInsignia } from '../../../../shared/ui/insignia-ui/insignia-ui';
import { TarjetaMetricaComponent } from '../../../../shared/ui/tarjeta-metrica/tarjeta-metrica';
import { GestorIdentidadTiendaComponent } from '../../componentes/gestor-identidad-tienda/gestor-identidad-tienda';
import { VendedorPanelStore } from '../../estado/vendedor-panel.store';
import { ProductoVendedor, TiendaVendedor } from '../../modelos/vendedor.model';

export type FiltroInventarioTienda = 'TODOS' | 'ACTIVOS' | 'INACTIVOS' | 'SIN_STOCK';

interface OpcionFiltroInventario {
  readonly valor: FiltroInventarioTienda;
  readonly etiqueta: string;
}

interface AvisoComercialTienda {
  readonly titulo: string;
  readonly descripcion: string;
  readonly variante: 'neutral' | 'advertencia' | 'error';
}

interface ProductoInventarioVista {
  readonly producto: ProductoVendedor;
  readonly estado: string;
  readonly detalleEstado: string;
  readonly varianteEstado: VarianteInsignia;
  readonly stock: string;
}

/** Centro operativo de una tienda. Toda la información se deriva del backend mediante el store. */
@Component({
  selector: 'app-pagina-vendedor-tienda',
  imports: [
    CurrencyPipe,
    NgOptimizedImage,
    RouterLink,
    BotonDirective,
    EstadoPantallaComponent,
    GrupoMetricasPanelComponent,
    GestorIdentidadTiendaComponent,
    InsigniaUi,
    TarjetaMetricaComponent,
  ],
  templateUrl: './pagina-vendedor-tienda.html',
  styleUrl: './pagina-vendedor-tienda.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaVendedorTienda implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly store = inject(VendedorPanelStore);
  readonly idTienda = signal<number | null>(null);
  readonly tienda = this.store.tiendaSeleccionada;
  readonly busquedaInventario = signal('');
  readonly filtroInventario = signal<FiltroInventarioTienda>('TODOS');
  readonly filtrosInventario: readonly OpcionFiltroInventario[] = [
    { valor: 'TODOS', etiqueta: 'Todos' },
    { valor: 'ACTIVOS', etiqueta: 'Activos' },
    { valor: 'INACTIVOS', etiqueta: 'Inactivos' },
    { valor: 'SIN_STOCK', etiqueta: 'Sin stock' },
  ];

  readonly productosActivos = computed(() =>
    this.store.productos().filter((producto) => producto.estado),
  );
  readonly productosInactivos = computed(() =>
    this.store.productos().filter((producto) => !producto.estado),
  );
  readonly productosPublicados = computed(
    () => this.productosActivos().filter((producto) => producto.visibleEnTienda).length,
  );
  readonly productosSinStock = computed(() =>
    this.productosActivos().filter((producto) => producto.stock <= 0),
  );
  readonly unidadesDisponibles = computed(() =>
    this.productosActivos().reduce((total, producto) => total + Math.max(0, producto.stock), 0),
  );

  readonly conteosInventario = computed<Record<FiltroInventarioTienda, number>>(() => ({
    TODOS: this.store.productos().length,
    ACTIVOS: this.productosActivos().length,
    INACTIVOS: this.productosInactivos().length,
    SIN_STOCK: this.productosSinStock().length,
  }));

  readonly productosFiltrados = computed(() => {
    const filtro = this.filtroInventario();
    const busqueda = this.normalizarTexto(this.busquedaInventario());

    return this.store.productos().filter((producto) => {
      const coincideFiltro =
        filtro === 'TODOS' ||
        (filtro === 'ACTIVOS' && producto.estado) ||
        (filtro === 'INACTIVOS' && !producto.estado) ||
        (filtro === 'SIN_STOCK' && producto.estado && producto.stock <= 0);

      if (!coincideFiltro) return false;
      if (!busqueda) return true;

      return this.normalizarTexto(`${producto.nombre} ${producto.tipoProducto}`).includes(busqueda);
    });
  });

  readonly inventarioVisible = computed<ProductoInventarioVista[]>(() =>
    this.productosFiltrados().map((producto) => this.presentarProducto(producto)),
  );
  readonly hayFiltrosAplicados = computed(
    () => this.filtroInventario() !== 'TODOS' || this.busquedaInventario().trim().length > 0,
  );
  readonly resumenResultados = computed(() => {
    const cantidad = this.productosFiltrados().length;
    return cantidad === 1 ? '1 producto encontrado' : `${cantidad} productos encontrados`;
  });
  readonly avisoComercial = computed<AvisoComercialTienda | null>(() => {
    const tienda = this.tienda();
    if (!tienda) return null;

    if (!tienda.estado) {
      return {
        titulo: 'Tienda inactiva',
        descripcion:
          'Tu catálogo se conserva, pero la tienda no está disponible para los clientes.',
        variante: 'neutral',
      };
    }

    const avisos: Record<string, AvisoComercialTienda> = {
      PENDIENTE: {
        titulo: 'Tu tienda está en revisión',
        descripcion: 'Puedes preparar el inventario mientras validamos la información comercial.',
        variante: 'advertencia',
      },
      OBSERVADA: {
        titulo: 'Revisa tu información comercial',
        descripcion:
          'Verifica los datos registrados antes de continuar con el proceso de aprobación.',
        variante: 'advertencia',
      },
      RECHAZADA: {
        titulo: 'La tienda aún no está aprobada',
        descripcion:
          'Actualiza la información comercial disponible para solicitar una nueva revisión.',
        variante: 'error',
      },
    };

    if (tienda.estadoRevision === 'APROBADA') return null;

    return (
      avisos[tienda.estadoRevision] ?? {
        titulo: 'Estado comercial por confirmar',
        descripcion:
          'Estamos verificando el estado actual de tu tienda. Tu inventario permanece disponible.',
        variante: 'neutral',
      }
    );
  });

  ngOnInit(): void {
    this.destroyRef.onDestroy(() => {
      const idTienda = this.idTienda();
      if (idTienda !== null) this.store.cancelarCargaCentroTienda(idTienda);
    });

    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const idTienda = Number(params.get('idTienda'));
      if (!Number.isInteger(idTienda) || idTienda <= 0) {
        void this.router.navigate(['/vendedor/tiendas']);
        return;
      }

      this.idTienda.set(idTienda);
      this.busquedaInventario.set('');
      this.filtroInventario.set('TODOS');
      this.cargarTienda(idTienda);
    });
  }

  establecerFiltroInventario(filtro: FiltroInventarioTienda): void {
    this.filtroInventario.set(filtro);
  }

  actualizarBusquedaInventario(evento: Event): void {
    this.busquedaInventario.set((evento.target as HTMLInputElement).value);
  }

  limpiarFiltrosInventario(): void {
    this.busquedaInventario.set('');
    this.filtroInventario.set('TODOS');
  }

  reintentarCarga(): void {
    const idTienda = this.idTienda();
    if (idTienda === null) return;

    this.store.limpiarMensajes();
    this.store.cargarCentroTienda(idTienda, true);
  }

  recargarIdentidad(): void {
    const idTienda = this.idTienda();
    if (idTienda !== null) this.store.cargarCentroTienda(idTienda, true);
  }

  estadoComercial(tienda: TiendaVendedor): string {
    if (!tienda.estado) return 'Tienda inactiva';

    const etiquetas: Record<string, string> = {
      PENDIENTE: 'En revisión',
      APROBADA: 'Activa en REGALIA',
      OBSERVADA: 'Requiere atención',
      RECHAZADA: 'No aprobada',
    };

    return etiquetas[tienda.estadoRevision] ?? 'Estado por confirmar';
  }

  varianteEstadoComercial(tienda: TiendaVendedor): VarianteInsignia {
    if (!tienda.estado) return 'neutral';

    const variantes: Record<string, VarianteInsignia> = {
      PENDIENTE: 'advertencia',
      APROBADA: 'exito',
      OBSERVADA: 'advertencia',
      RECHAZADA: 'error',
    };

    return variantes[tienda.estadoRevision] ?? 'neutral';
  }

  inicialesTienda(nombre: string): string {
    const iniciales = nombre
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((palabra) => palabra.charAt(0))
      .join('');

    return iniciales.toLocaleUpperCase('es-PE') || 'RG';
  }

  private cargarTienda(idTienda: number): void {
    this.store.limpiarMensajes();
    this.store.cargarCentroTienda(idTienda);
  }

  private presentarProducto(producto: ProductoVendedor): ProductoInventarioVista {
    if (!producto.estado) {
      return {
        producto,
        estado: 'Inactivo',
        detalleEstado: 'Fuera del catálogo operativo',
        varianteEstado: 'neutral',
        stock: this.describirStock(producto.stock),
      };
    }

    if (producto.stock <= 0) {
      return {
        producto,
        estado: 'Sin stock',
        detalleEstado: producto.visibleEnTienda
          ? 'Publicado, pero sin unidades'
          : 'Oculto y sin unidades',
        varianteEstado: 'advertencia',
        stock: 'Sin unidades disponibles',
      };
    }

    if (producto.visibleEnTienda) {
      return {
        producto,
        estado: 'Publicado',
        detalleEstado: 'Visible para clientes',
        varianteEstado: 'exito',
        stock: this.describirStock(producto.stock),
      };
    }

    return {
      producto,
      estado: 'Oculto',
      detalleEstado: 'Activo, no visible para clientes',
      varianteEstado: 'primaria',
      stock: this.describirStock(producto.stock),
    };
  }

  private describirStock(stock: number): string {
    if (stock <= 0) return 'Sin unidades disponibles';
    return stock === 1 ? '1 unidad disponible' : `${stock} unidades disponibles`;
  }

  private normalizarTexto(valor: string): string {
    return valor
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLocaleLowerCase('es-PE');
  }
}
