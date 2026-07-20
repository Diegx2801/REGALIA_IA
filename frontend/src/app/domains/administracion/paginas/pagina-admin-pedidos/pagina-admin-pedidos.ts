import { CurrencyPipe, DatePipe } from '@angular/common';
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
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { obtenerMensajeErrorUsuario } from '../../../../core/http/modelos/error-api.model';
import { BotonDirective } from '../../../../shared/directivas/boton.directive';
import { EstadoPantallaComponent } from '../../../../shared/ui/estado-pantalla/estado-pantalla';
import { FiltrosPanelComponent } from '../../../../shared/ui/filtros-panel/filtros-panel';
import { GrupoMetricasPanelComponent } from '../../../../shared/ui/grupo-metricas-panel/grupo-metricas-panel';
import { PaginacionPanelComponent } from '../../../../shared/ui/paginacion-panel/paginacion-panel';
import { TarjetaMetricaComponent } from '../../../../shared/ui/tarjeta-metrica/tarjeta-metrica';
import {
  ConsultaPedidosAdmin,
  PanelAdministracionApiService,
} from '../../acceso-datos/panel-administracion-api.service';
import { PedidoAdministracion } from '../../modelos/panel-administracion.model';

type EstadoPagoPedido = NonNullable<ConsultaPedidosAdmin['estadoPago']>;
type EstadoPedido = NonNullable<ConsultaPedidosAdmin['estadoPedido']>;
type CampoBusquedaPedido = NonNullable<ConsultaPedidosAdmin['searchField']>;
type OrdenPedidos = NonNullable<ConsultaPedidosAdmin['sort']>;
type NivelPrioridadPedido = 'alta' | 'media' | 'normal' | 'cerrada';

@Component({
  selector: 'app-pagina-admin-pedidos',
  imports: [
    CurrencyPipe,
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    BotonDirective,
    EstadoPantallaComponent,
    FiltrosPanelComponent,
    GrupoMetricasPanelComponent,
    PaginacionPanelComponent,
    TarjetaMetricaComponent,
  ],
  templateUrl: './pagina-admin-pedidos.html',
  styleUrl: './pagina-admin-pedidos.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaAdminPedidos implements OnInit {
  private readonly adminApi = inject(PanelAdministracionApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fechaHoy = this.obtenerFechaLocalIso(new Date());

  readonly pedidos = signal<PedidoAdministracion[]>([]);
  readonly totalPedidos = signal(0);
  readonly paginaActual = signal(0);
  readonly totalPaginas = signal(0);
  readonly cargando = signal(true);
  readonly cargaCompletada = signal(false);
  readonly mensajeError = signal<string | null>(null);
  readonly mensajeValidacion = signal<string | null>(null);

  readonly montoPagado = computed(() =>
    this.pedidos().reduce((total, pedido) => total + pedido.montoPagado, 0),
  );
  readonly saldoPendiente = computed(() =>
    this.pedidos().reduce((total, pedido) => total + pedido.saldoPendiente, 0),
  );
  readonly pedidosConAlerta = computed(
    () =>
      this.pedidos().filter(
        (pedido) =>
          !this.esPedidoCerrado(pedido) &&
          (pedido.saldoPendiente > 0 || this.estaEntregaVencida(pedido)),
      ).length,
  );
  readonly entregasProximas = computed(
    () => this.pedidos().filter((pedido) => this.esEntregaProxima(pedido)).length,
  );

  readonly formularioFiltros = new FormGroup({
    estadoPago: new FormControl<EstadoPagoPedido | 'TODOS'>('TODOS', { nonNullable: true }),
    estadoPedido: new FormControl<EstadoPedido | 'TODOS'>('TODOS', { nonNullable: true }),
    idTienda: new FormControl<number | null>(null),
    campoBusqueda: new FormControl<CampoBusquedaPedido>('id_pedido', { nonNullable: true }),
    busqueda: new FormControl('', { nonNullable: true }),
    fechaDesde: new FormControl('', { nonNullable: true }),
    fechaHasta: new FormControl('', { nonNullable: true }),
    orden: new FormControl<OrdenPedidos>('fechaCreacion,desc', { nonNullable: true }),
    tamanioPagina: new FormControl<10 | 20 | 50>(10, { nonNullable: true }),
  });

  ngOnInit(): void {
    this.cargarPedidos();
  }

  cargarPedidos(): void {
    this.cargando.set(true);
    this.mensajeError.set(null);

    this.adminApi
      .obtenerPedidos(this.crearConsulta())
      .pipe(
        finalize(() => this.cargando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (pagina) => {
          this.pedidos.set(pagina.contenido);
          this.totalPedidos.set(pagina.totalElementos);
          this.totalPaginas.set(pagina.totalPaginas);
          this.cargaCompletada.set(true);
        },
        error: (error: unknown) =>
          this.mensajeError.set(
            obtenerMensajeErrorUsuario(error, 'No pudimos cargar los pedidos.'),
          ),
      });
  }

  aplicarFiltros(): void {
    if (!this.validarFiltros()) return;
    this.paginaActual.set(0);
    this.cargarPedidos();
  }

  limpiarFiltros(): void {
    this.formularioFiltros.reset({
      estadoPago: 'TODOS',
      estadoPedido: 'TODOS',
      idTienda: null,
      campoBusqueda: 'id_pedido',
      busqueda: '',
      fechaDesde: '',
      fechaHasta: '',
      orden: 'fechaCreacion,desc',
      tamanioPagina: 10,
    });
    this.mensajeValidacion.set(null);
    this.aplicarFiltros();
  }

  paginaAnterior(): void {
    if (this.paginaActual() === 0 || this.cargando()) return;
    this.paginaActual.update((pagina) => pagina - 1);
    this.cargarPedidos();
  }

  paginaSiguiente(): void {
    if (this.paginaActual() + 1 >= this.totalPaginas() || this.cargando()) return;
    this.paginaActual.update((pagina) => pagina + 1);
    this.cargarPedidos();
  }

  hayFiltrosActivos(): boolean {
    const filtros = this.formularioFiltros.getRawValue();
    return (
      filtros.estadoPago !== 'TODOS' ||
      filtros.estadoPedido !== 'TODOS' ||
      filtros.idTienda !== null ||
      filtros.busqueda.trim().length > 0 ||
      Boolean(filtros.fechaDesde) ||
      Boolean(filtros.fechaHasta)
    );
  }

  nivelPrioridad(pedido: PedidoAdministracion): NivelPrioridadPedido {
    if (this.esPedidoCerrado(pedido)) return 'cerrada';
    if (this.estaEntregaVencida(pedido)) return 'alta';
    if (pedido.saldoPendiente > 0 || this.esEntregaProxima(pedido)) return 'media';
    return 'normal';
  }

  etiquetaPrioridad(pedido: PedidoAdministracion): string {
    const etiquetas: Record<NivelPrioridadPedido, string> = {
      alta: 'Atención inmediata',
      media: 'Requiere seguimiento',
      normal: 'Operación al día',
      cerrada: 'Ciclo cerrado',
    };
    return etiquetas[this.nivelPrioridad(pedido)];
  }

  etiquetaEstadoPedido(estado: string): string {
    const etiquetas: Record<string, string> = {
      RESERVADO: 'Reservado',
      EN_PREPARACION: 'En preparación',
      LISTO: 'Listo para entregar',
      ENTREGADO: 'Entregado',
      ANULADO: 'Anulado',
    };
    return etiquetas[estado] ?? estado;
  }

  etiquetaPago(pedido: PedidoAdministracion): string {
    return pedido.saldoPendiente > 0 ? 'Con saldo' : 'Pagado';
  }

  estaEntregaVencida(pedido: PedidoAdministracion): boolean {
    return (
      !this.esPedidoCerrado(pedido) &&
      Boolean(pedido.fechaEntrega) &&
      (pedido.fechaEntrega ?? '') < this.fechaHoy
    );
  }

  private esEntregaProxima(pedido: PedidoAdministracion): boolean {
    if (this.esPedidoCerrado(pedido) || !pedido.fechaEntrega) return false;
    const hoy = this.crearFechaLocal(this.fechaHoy);
    const entrega = this.crearFechaLocal(pedido.fechaEntrega);
    const dias = Math.ceil((entrega.getTime() - hoy.getTime()) / 86_400_000);
    return dias >= 0 && dias <= 3;
  }

  private esPedidoCerrado(pedido: PedidoAdministracion): boolean {
    return pedido.estadoPedido === 'ENTREGADO' || pedido.estadoPedido === 'ANULADO';
  }

  private validarFiltros(): boolean {
    const { fechaDesde, fechaHasta, idTienda } = this.formularioFiltros.getRawValue();
    if (fechaDesde && fechaHasta && fechaDesde > fechaHasta) {
      this.mensajeValidacion.set('La fecha desde no puede ser posterior a la fecha hasta.');
      return false;
    }
    if (idTienda !== null && (!Number.isInteger(idTienda) || idTienda <= 0)) {
      this.mensajeValidacion.set('El ID de tienda debe ser un número entero mayor a cero.');
      return false;
    }
    this.mensajeValidacion.set(null);
    return true;
  }

  private crearConsulta(): ConsultaPedidosAdmin {
    const filtros = this.formularioFiltros.getRawValue();
    return {
      page: this.paginaActual(),
      size: filtros.tamanioPagina,
      estadoPago: filtros.estadoPago === 'TODOS' ? undefined : filtros.estadoPago,
      estadoPedido: filtros.estadoPedido === 'TODOS' ? undefined : filtros.estadoPedido,
      idTienda: filtros.idTienda ?? undefined,
      searchField: filtros.campoBusqueda,
      search: filtros.busqueda,
      fechaDesde: filtros.fechaDesde || undefined,
      fechaHasta: filtros.fechaHasta || undefined,
      sort: filtros.orden,
    };
  }

  private obtenerFechaLocalIso(fecha: Date): string {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  private crearFechaLocal(valor: string): Date {
    const [anio = 0, mes = 1, dia = 1] = valor.split('-').map(Number);
    return new Date(anio, mes - 1, dia);
  }
}
