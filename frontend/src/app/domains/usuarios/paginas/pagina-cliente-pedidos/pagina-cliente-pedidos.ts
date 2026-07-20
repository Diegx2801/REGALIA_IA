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
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { ConsultaPedidosCliente } from '../../acceso-datos/pedido-cliente-api.service';
import { BotonDirective } from '../../../../shared/directivas/boton.directive';
import { EstadoPantallaComponent } from '../../../../shared/ui/estado-pantalla/estado-pantalla';
import { PaginacionPanelComponent } from '../../../../shared/ui/paginacion-panel/paginacion-panel';
import { PedidosClienteStore } from '../../estado/pedidos-cliente.store';
import {
  obtenerEtiquetaEstadoPedidoCliente,
  PedidoClienteResumen,
} from '../../modelos/pedido-cliente.model';

const ORDEN_PREDETERMINADO = 'fechaCreacion,desc';
const ESTADOS_PEDIDO = ['RESERVADO', 'EN_PREPARACION', 'LISTO', 'ENTREGADO', 'ANULADO'] as const;
const ORDENES_PEDIDO = [
  ORDEN_PREDETERMINADO,
  'fechaEntrega,asc',
  'saldoPendiente,desc',
  'total,desc',
  'nombreTienda,asc',
] as const;

type EstadoPedidoFiltro = (typeof ESTADOS_PEDIDO)[number];
type EstadoPasoSeguimiento = 'completado' | 'actual' | 'pendiente';

@Component({
  selector: 'app-pagina-cliente-pedidos',
  imports: [
    CurrencyPipe,
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    BotonDirective,
    EstadoPantallaComponent,
    PaginacionPanelComponent,
  ],
  templateUrl: './pagina-cliente-pedidos.html',
  styleUrl: './pagina-cliente-pedidos.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaClientePedidos implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly store = inject(PedidosClienteStore);
  readonly consultaActual = signal<ConsultaPedidosCliente>({ page: 0, size: 10 });
  readonly estadosRapidos = [
    { valor: '', etiqueta: 'Todos' },
    { valor: 'RESERVADO', etiqueta: 'Reservados' },
    { valor: 'EN_PREPARACION', etiqueta: 'En preparación' },
    { valor: 'LISTO', etiqueta: 'Listos' },
    { valor: 'ENTREGADO', etiqueta: 'Entregados' },
  ] as const;
  readonly pasosSeguimiento = [
    { estado: 'RESERVADO', etiqueta: 'Reservado' },
    { estado: 'EN_PREPARACION', etiqueta: 'Preparación' },
    { estado: 'LISTO', etiqueta: 'Listo' },
    { estado: 'ENTREGADO', etiqueta: 'Entregado' },
  ] as const;
  readonly cantidadFiltrosActivos = computed(() => {
    const consulta = this.consultaActual();
    return [
      consulta.q,
      consulta.estado,
      consulta.estadoPago,
      consulta.sort && consulta.sort !== ORDEN_PREDETERMINADO ? consulta.sort : undefined,
    ].filter(Boolean).length;
  });
  readonly pedidosEnCursoPagina = computed(
    () =>
      this.store
        .pedidos()
        .filter((pedido) => ['RESERVADO', 'EN_PREPARACION', 'LISTO'].includes(pedido.estadoPedido))
        .length,
  );
  readonly pedidosEntregadosPagina = computed(
    () => this.store.pedidos().filter((pedido) => pedido.estadoPedido === 'ENTREGADO').length,
  );
  readonly pedidosConSaldoPagina = computed(
    () => this.store.pedidos().filter((pedido) => pedido.saldoPendiente > 0).length,
  );
  readonly formularioFiltros = new FormGroup({
    q: new FormControl('', { nonNullable: true }),
    estado: new FormControl('', { nonNullable: true }),
    estadoPago: new FormControl('', { nonNullable: true }),
    sort: new FormControl(ORDEN_PREDETERMINADO, { nonNullable: true }),
  });

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((parametros) => {
      const consulta = this.construirConsulta(parametros);
      this.consultaActual.set(consulta);
      this.formularioFiltros.patchValue(
        {
          q: consulta.q ?? '',
          estado: consulta.estado ?? '',
          estadoPago: consulta.estadoPago ?? '',
          sort: consulta.sort ?? ORDEN_PREDETERMINADO,
        },
        { emitEvent: false },
      );
      this.store.cargarListado(consulta);
    });
  }

  aplicarFiltros(): void {
    const filtros = this.formularioFiltros.getRawValue();
    this.actualizarUrl({
      page: 0,
      size: this.consultaActual().size ?? 10,
      q: filtros.q.trim() || undefined,
      estado: filtros.estado || undefined,
      estadoPago: (filtros.estadoPago || undefined) as ConsultaPedidosCliente['estadoPago'],
      sort: filtros.sort,
    });
  }

  aplicarEstadoRapido(estado: '' | EstadoPedidoFiltro): void {
    this.actualizarUrl({
      ...this.consultaActual(),
      page: 0,
      estado: estado || undefined,
    });
  }

  limpiarFiltros(): void {
    this.actualizarUrl({ page: 0, size: 10 });
  }

  paginaAnterior(): void {
    const pagina = this.store.paginaActual();
    if (pagina > 0) this.actualizarUrl({ ...this.consultaActual(), page: pagina - 1 });
  }

  paginaSiguiente(): void {
    if (!this.store.ultimaPagina()) {
      this.actualizarUrl({ ...this.consultaActual(), page: this.store.paginaActual() + 1 });
    }
  }

  recargarPedidos(): void {
    this.store.cargarListado(this.consultaActual());
  }

  etiquetaEstado(estado: string): string {
    return obtenerEtiquetaEstadoPedidoCliente(estado);
  }

  etiquetaPago(pedido: PedidoClienteResumen): string {
    return pedido.saldoPendiente > 0 ? 'Saldo pendiente' : 'Pago completo';
  }

  porcentajePagado(pedido: PedidoClienteResumen): number {
    if (pedido.total <= 0) return 100;
    return Math.min(100, Math.max(0, Math.round((pedido.montoPagado / pedido.total) * 100)));
  }

  estadoPaso(estadoPedido: string, indicePaso: number): EstadoPasoSeguimiento {
    if (estadoPedido === 'ANULADO') return 'pendiente';
    const indiceActual = this.pasosSeguimiento.findIndex((paso) => paso.estado === estadoPedido);
    if (indiceActual < 0 || indicePaso > indiceActual) return 'pendiente';
    return indicePaso === indiceActual ? 'actual' : 'completado';
  }

  private actualizarUrl(consulta: ConsultaPedidosCliente): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: consulta,
    });
  }

  private construirConsulta(parametros: ParamMap): ConsultaPedidosCliente {
    return {
      page: this.obtenerNumeroPagina(parametros.get('page')),
      size: this.obtenerNumeroTamanio(parametros.get('size')),
      q: parametros.get('q')?.trim() || undefined,
      estado: this.obtenerEstado(parametros.get('estado')),
      estadoPago: this.obtenerEstadoPago(parametros.get('estadoPago')),
      sort: this.obtenerOrden(parametros.get('sort')),
    };
  }

  private obtenerNumeroPagina(valor: string | null): number {
    const pagina = Number(valor);
    return Number.isInteger(pagina) && pagina >= 0 ? pagina : 0;
  }

  private obtenerNumeroTamanio(valor: string | null): number {
    const tamanio = Number(valor);
    return Number.isInteger(tamanio) && tamanio >= 1 && tamanio <= 50 ? tamanio : 10;
  }

  private obtenerEstadoPago(valor: string | null): ConsultaPedidosCliente['estadoPago'] {
    return valor === 'PAGADO' || valor === 'CON_SALDO' ? valor : undefined;
  }

  private obtenerEstado(valor: string | null): EstadoPedidoFiltro | undefined {
    const estado = valor?.trim().toUpperCase();
    return ESTADOS_PEDIDO.find((opcion) => opcion === estado);
  }

  private obtenerOrden(valor: string | null): string {
    const orden = valor?.trim();
    return ORDENES_PEDIDO.find((opcion) => opcion === orden) ?? ORDEN_PREDETERMINADO;
  }
}
