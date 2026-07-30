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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
import {
  enteroDesdeUrl,
  parametrosDeConsulta,
  textoDesdeUrl,
  valorPermitidoDesdeUrl,
} from '../../utilidades/consulta-admin-url.util';

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
  private static readonly TAMANIO_PAGINA = 20;
  private readonly adminApi = inject(PanelAdministracionApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
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
  });

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((parametros) => {
      this.aplicarParametrosUrl(parametros);
      this.cargarPedidos();
    });
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
    this.actualizarUrlConsulta(0);
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
    });
    this.mensajeValidacion.set(null);
    this.actualizarUrlConsulta(0);
  }

  paginaAnterior(): void {
    if (this.paginaActual() === 0 || this.cargando()) return;
    this.actualizarUrlConsulta(this.paginaActual() - 1);
  }

  paginaSiguiente(): void {
    if (this.paginaActual() + 1 >= this.totalPaginas() || this.cargando()) return;
    this.actualizarUrlConsulta(this.paginaActual() + 1);
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
      size: PaginaAdminPedidos.TAMANIO_PAGINA,
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

  private aplicarParametrosUrl(parametros: import('@angular/router').ParamMap): void {
    const estadoPago = valorPermitidoDesdeUrl(parametros, 'pago', 'TODOS', [
      'TODOS', 'PAGADO', 'CON_SALDO',
    ] as const);
    const estadoPedido = valorPermitidoDesdeUrl(parametros, 'estado', 'TODOS', [
      'TODOS', 'RESERVADO', 'EN_PREPARACION', 'LISTO', 'ENTREGADO', 'ANULADO',
    ] as const);
    const campoBusqueda = valorPermitidoDesdeUrl(parametros, 'campo', 'id_pedido', [
      'id_pedido', 'nombre_tienda', 'id_usuario',
    ] as const);
    const orden = valorPermitidoDesdeUrl(parametros, 'orden', 'fechaCreacion,desc', [
      'fechaCreacion,asc', 'fechaCreacion,desc', 'fechaEntrega,asc', 'fechaEntrega,desc',
      'total,asc', 'total,desc',
    ] as const);
    const idTienda = enteroDesdeUrl(parametros, 'tienda', 0);

    this.paginaActual.set(enteroDesdeUrl(parametros, 'pagina', 0));
    this.formularioFiltros.patchValue({
      estadoPago,
      estadoPedido,
      idTienda: idTienda > 0 ? idTienda : null,
      campoBusqueda,
      busqueda: textoDesdeUrl(parametros, 'buscar', ''),
      fechaDesde: this.fechaDesdeValida(textoDesdeUrl(parametros, 'desde', '')),
      fechaHasta: this.fechaDesdeValida(textoDesdeUrl(parametros, 'hasta', '')),
      orden,
    }, { emitEvent: false });
  }

  private actualizarUrlConsulta(pagina: number): void {
    const filtros = this.formularioFiltros.getRawValue();
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: parametrosDeConsulta(
        {
          pago: filtros.estadoPago,
          estado: filtros.estadoPedido,
          tienda: filtros.idTienda,
          campo: filtros.campoBusqueda,
          buscar: filtros.busqueda.trim(),
          desde: filtros.fechaDesde,
          hasta: filtros.fechaHasta,
          orden: filtros.orden,
          pagina,
        },
        {
          pago: 'TODOS', estado: 'TODOS', tienda: null, campo: 'id_pedido', buscar: '',
          desde: '', hasta: '', orden: 'fechaCreacion,desc', pagina: 0,
        },
      ),
      replaceUrl: true,
    });
  }

  private fechaDesdeValida(valor: string): string {
    return /^\d{4}-\d{2}-\d{2}$/.test(valor) ? valor : '';
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
