import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { combineLatest, distinctUntilChanged, finalize, map } from 'rxjs';
import { obtenerMensajeErrorUsuario } from '../../../../core/http/modelos/error-api.model';
import {
  ConsultaPedidosVendedor,
  EstadoPagoFiltroVendedor,
  EstadoPedidoFiltroVendedor,
  OrdenPedidosVendedor,
  VendedorApiService,
} from '../../acceso-datos/vendedor-api.service';
import { DetallePedidoVendedor } from '../../componentes/detalle-pedido-vendedor/detalle-pedido-vendedor';
import { VendedorPanelStore } from '../../estado/vendedor-panel.store';
import { PedidoRecibidoResumen } from '../../modelos/vendedor.model';
import {
  formatearFechaCalendario,
  obtenerPresentacionEstadoPedido,
  obtenerPresentacionPagoPedido,
  obtenerPrioridadPedido,
} from '../../presentacion/pedido-vendedor.presentacion';
import { BotonDirective } from '../../../../shared/directivas/boton.directive';
import { DialogoUi } from '../../../../shared/ui/dialogo-ui/dialogo-ui';
import { EstadoPantallaComponent } from '../../../../shared/ui/estado-pantalla/estado-pantalla';
import { InsigniaUi } from '../../../../shared/ui/insignia-ui/insignia-ui';
import { PaginacionPanelComponent } from '../../../../shared/ui/paginacion-panel/paginacion-panel';

type VistaRapidaPedidos = 'todos' | 'nuevos' | 'preparacion' | 'listos' | 'con-saldo';

interface ContextoConsultaPedidos {
  idTiendaFija: number | null;
  consulta: ConsultaPedidosVendedor;
  clave: string;
}

const ORDEN_PEDIDOS_PREDETERMINADO: OrdenPedidosVendedor = 'fechaCreacion,desc';
const ESTADOS_PEDIDO_VALIDOS = new Set<EstadoPedidoFiltroVendedor>([
  'RESERVADO',
  'EN_PREPARACION',
  'LISTO',
  'ENTREGADO',
  'ANULADO',
]);
const ORDENES_PEDIDOS_VALIDOS = new Set<OrdenPedidosVendedor>([
  'fechaCreacion,desc',
  'fechaEntrega,asc',
  'nombreTienda,asc',
  'total,desc',
  'saldoPendiente,desc',
]);

@Component({
  selector: 'app-pagina-vendedor-pedidos',
  imports: [
    BotonDirective,
    CurrencyPipe,
    DatePipe,
    DetallePedidoVendedor,
    DialogoUi,
    EstadoPantallaComponent,
    InsigniaUi,
    PaginacionPanelComponent,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './pagina-vendedor-pedidos.html',
  styleUrl: './pagina-vendedor-pedidos.css',
})
export class PaginaVendedorPedidos implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly vendedorApi = inject(VendedorApiService);

  readonly store = inject(VendedorPanelStore);
  readonly idTiendaFija = signal<number | null>(null);
  readonly consultaActual = signal<ConsultaPedidosVendedor>({
    page: 0,
    size: 10,
    sort: ORDEN_PEDIDOS_PREDETERMINADO,
  });
  readonly dialogoDetalleAbierto = signal(false);
  readonly procesandoCumplimiento = signal(false);
  readonly mensajeCumplimiento = signal<string | null>(null);

  readonly formularioFiltros = new FormGroup({
    idTienda: new FormControl('', { nonNullable: true }),
    q: new FormControl('', { nonNullable: true }),
    estado: new FormControl<EstadoPedidoFiltroVendedor | ''>('', { nonNullable: true }),
    estadoPago: new FormControl<EstadoPagoFiltroVendedor | ''>('', { nonNullable: true }),
    sort: new FormControl<OrdenPedidosVendedor>(ORDEN_PEDIDOS_PREDETERMINADO, {
      nonNullable: true,
    }),
  });

  readonly tiendaContexto = computed(() => {
    const idTienda = this.idTiendaFija();
    return idTienda === null
      ? null
      : (this.store.tiendas().find((tienda) => tienda.idTienda === idTienda) ?? null);
  });
  readonly pedidosPresentados = computed(() =>
    this.store.pedidos().map((pedido) => ({
      pedido,
      estado: obtenerPresentacionEstadoPedido(pedido.estadoPedido),
      pago: obtenerPresentacionPagoPedido(pedido),
      prioridad: obtenerPrioridadPedido(pedido),
    })),
  );
  readonly pedidosUrgentesPagina = computed(
    () => this.pedidosPresentados().filter(({ prioridad }) => prioridad.nivel === 'urgente').length,
  );
  readonly pedidosAtencionPagina = computed(
    () =>
      this.pedidosPresentados().filter(({ prioridad }) => prioridad.nivel === 'atencion').length,
  );
  readonly pedidosActivosPagina = computed(
    () =>
      this.store
        .pedidos()
        .filter((pedido) => !['ENTREGADO', 'ANULADO'].includes(pedido.estadoPedido.toUpperCase()))
        .length,
  );
  readonly saldoPendientePagina = computed(() =>
    this.store.pedidos().reduce((total, pedido) => total + pedido.saldoPendiente, 0),
  );
  readonly cantidadFiltrosActivos = computed(() => {
    const consulta = this.consultaActual();
    return [
      this.idTiendaFija() === null ? consulta.idTienda : undefined,
      consulta.q,
      consulta.estado,
      consulta.estadoPago,
      consulta.sort !== ORDEN_PEDIDOS_PREDETERMINADO ? consulta.sort : undefined,
    ].filter((valor) => valor !== undefined && valor !== '').length;
  });
  readonly hayFiltrosQueReducenResultados = computed(() => {
    const consulta = this.consultaActual();
    return Boolean(
      (this.idTiendaFija() === null && consulta.idTienda) ||
      consulta.q ||
      consulta.estado ||
      consulta.estadoPago,
    );
  });
  readonly vistaRapidaActiva = computed<VistaRapidaPedidos>(() => {
    const consulta = this.consultaActual();
    if (consulta.estado === 'RESERVADO' && !consulta.estadoPago) return 'nuevos';
    if (consulta.estado === 'EN_PREPARACION' && !consulta.estadoPago) return 'preparacion';
    if (consulta.estado === 'LISTO' && !consulta.estadoPago) return 'listos';
    if (!consulta.estado && consulta.estadoPago === 'CON_SALDO') return 'con-saldo';
    return 'todos';
  });
  readonly rutaGestionCatalogo = computed(() => {
    const idTienda = this.idTiendaFija() ?? this.store.tiendas()[0]?.idTienda;
    return idTienda ? ['/vendedor/tiendas', idTienda] : ['/vendedor/tiendas'];
  });

  ngOnInit(): void {
    this.store.cargarTiendasParaPedidos();

    combineLatest([this.route.paramMap, this.route.queryParamMap])
      .pipe(
        map(([parametrosRuta, parametrosConsulta]) =>
          this.construirContextoConsulta(parametrosRuta, parametrosConsulta),
        ),
        distinctUntilChanged((anterior, actual) => anterior.clave === actual.clave),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ idTiendaFija, consulta }) => {
        this.idTiendaFija.set(idTiendaFija);
        this.consultaActual.set(consulta);
        this.dialogoDetalleAbierto.set(false);
        this.sincronizarFormulario(consulta);
        this.store.cargarPedidosPaginados(consulta);
      });

    this.destroyRef.onDestroy(() => this.store.cancelarGestionPedidos());
  }

  aplicarFiltros(): void {
    const filtros = this.formularioFiltros.getRawValue();
    this.actualizarUrl({
      page: 0,
      size: this.consultaActual().size ?? 10,
      idTienda: this.idTiendaFija() ?? this.obtenerNumeroPositivo(filtros.idTienda),
      q: filtros.q.trim() || undefined,
      estado: filtros.estado || undefined,
      estadoPago: filtros.estadoPago || undefined,
      sort: filtros.sort,
    });
  }

  aplicarVistaRapida(vista: VistaRapidaPedidos): void {
    const estado: EstadoPedidoFiltroVendedor | '' =
      vista === 'nuevos'
        ? 'RESERVADO'
        : vista === 'preparacion'
          ? 'EN_PREPARACION'
          : vista === 'listos'
            ? 'LISTO'
            : '';
    const estadoPago: EstadoPagoFiltroVendedor | '' = vista === 'con-saldo' ? 'CON_SALDO' : '';

    this.formularioFiltros.patchValue({ estado, estadoPago });
    this.aplicarFiltros();
  }

  limpiarFiltros(): void {
    this.actualizarUrl({
      page: 0,
      size: 10,
      idTienda: this.idTiendaFija() ?? undefined,
      sort: ORDEN_PEDIDOS_PREDETERMINADO,
    });
  }

  paginaAnterior(): void {
    if (this.store.paginaPedidosActual() <= 0) return;
    this.actualizarUrl({
      ...this.consultaActual(),
      page: this.store.paginaPedidosActual() - 1,
    });
  }

  paginaSiguiente(): void {
    if (this.store.ultimaPaginaPedidos()) return;
    this.actualizarUrl({
      ...this.consultaActual(),
      page: this.store.paginaPedidosActual() + 1,
    });
  }

  recargarPedidos(): void {
    this.dialogoDetalleAbierto.set(false);
    this.store.cargarPedidosPaginados(this.consultaActual());
  }

  recargarTiendas(): void {
    this.store.cargarTiendasParaPedidos(true);
  }

  abrirDetalle(pedido: PedidoRecibidoResumen): void {
    this.dialogoDetalleAbierto.set(true);
    this.store.seleccionarPedido(pedido.idPedido);
  }

  cerrarDetalle(): void {
    this.dialogoDetalleAbierto.set(false);
  }

  reintentarDetalle(): void {
    const idPedido = this.store.idPedidoSeleccionado();
    if (idPedido !== null) this.store.seleccionarPedido(idPedido, true);
  }

  iniciarPreparacion(): void {
    this.ejecutarAccionCumplimiento((idPedido) =>
      this.vendedorApi.iniciarPreparacionPedido(idPedido),
    );
  }

  marcarPedidoListo(): void {
    this.ejecutarAccionCumplimiento((idPedido) => this.vendedorApi.marcarPedidoListo(idPedido));
  }

  confirmarEntrega(codigoEntrega: string): void {
    this.ejecutarAccionCumplimiento((idPedido) =>
      this.vendedorApi.confirmarEntregaPedido(idPedido, codigoEntrega),
    );
  }

  formatearFechaEntrega(fecha: string): string {
    return formatearFechaCalendario(fecha);
  }

  private ejecutarAccionCumplimiento(
    accion: (idPedido: number) => ReturnType<VendedorApiService['marcarPedidoListo']>,
  ): void {
    const idPedido = this.store.idPedidoSeleccionado();
    if (idPedido === null || this.procesandoCumplimiento()) return;

    this.procesandoCumplimiento.set(true);
    this.mensajeCumplimiento.set(null);
    accion(idPedido)
      .pipe(
        finalize(() => this.procesandoCumplimiento.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (respuesta) => {
          this.mensajeCumplimiento.set(
            respuesta.estadoPedido === 'LISTO'
              ? 'El pedido está listo. Enviamos el código de entrega al cliente.'
              : respuesta.estadoPedido === 'ENTREGADO'
                ? 'La entrega fue confirmada correctamente.'
                : 'El pedido ahora está en preparación.',
          );
          this.store.actualizarEstadoPedido(idPedido, respuesta.estadoPedido);
          this.store.seleccionarPedido(idPedido, true);
        },
        error: (error: unknown) => {
          this.mensajeCumplimiento.set(
            obtenerMensajeErrorUsuario(error, 'No pudimos actualizar este pedido. Inténtalo nuevamente.'),
          );
        },
      });
  }

  private actualizarUrl(consulta: ConsultaPedidosVendedor): void {
    const pagina = consulta.page ?? 0;
    const tamanio = consulta.size ?? 10;
    const orden = consulta.sort ?? ORDEN_PEDIDOS_PREDETERMINADO;

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        page: pagina > 0 ? pagina : undefined,
        size: tamanio !== 10 ? tamanio : undefined,
        idTienda: this.idTiendaFija() === null ? consulta.idTienda : undefined,
        q: consulta.q,
        estado: consulta.estado,
        estadoPago: consulta.estadoPago,
        sort: orden !== ORDEN_PEDIDOS_PREDETERMINADO ? orden : undefined,
      },
    });
  }

  private construirContextoConsulta(
    parametrosRuta: ParamMap,
    parametrosConsulta: ParamMap,
  ): ContextoConsultaPedidos {
    const idTiendaFija = this.obtenerNumeroPositivo(parametrosRuta.get('idTienda')) ?? null;
    const consulta: ConsultaPedidosVendedor = {
      page: this.obtenerPagina(parametrosConsulta.get('page')),
      size: this.obtenerTamanio(parametrosConsulta.get('size')),
      idTienda: idTiendaFija ?? this.obtenerNumeroPositivo(parametrosConsulta.get('idTienda')),
      q: parametrosConsulta.get('q')?.trim() || undefined,
      estado: this.obtenerEstadoPedido(parametrosConsulta.get('estado')),
      estadoPago: this.obtenerEstadoPago(parametrosConsulta.get('estadoPago')),
      sort: this.obtenerOrden(parametrosConsulta.get('sort')),
    };

    return {
      idTiendaFija,
      consulta,
      clave: JSON.stringify({ idTiendaFija, ...consulta }),
    };
  }

  private sincronizarFormulario(consulta: ConsultaPedidosVendedor): void {
    this.formularioFiltros.patchValue(
      {
        idTienda: consulta.idTienda?.toString() ?? '',
        q: consulta.q ?? '',
        estado: consulta.estado ?? '',
        estadoPago: consulta.estadoPago ?? '',
        sort: consulta.sort ?? ORDEN_PEDIDOS_PREDETERMINADO,
      },
      { emitEvent: false },
    );
  }

  private obtenerPagina(valor: string | null): number {
    const pagina = Number(valor);
    return Number.isInteger(pagina) && pagina >= 0 ? pagina : 0;
  }

  private obtenerTamanio(valor: string | null): number {
    const tamanio = Number(valor);
    return Number.isInteger(tamanio) && tamanio >= 1 && tamanio <= 50 ? tamanio : 10;
  }

  private obtenerNumeroPositivo(valor: string | null): number | undefined {
    const numero = Number(valor);
    return Number.isInteger(numero) && numero > 0 ? numero : undefined;
  }

  private obtenerEstadoPedido(valor: string | null): EstadoPedidoFiltroVendedor | undefined {
    const estado = valor?.trim().toUpperCase() as EstadoPedidoFiltroVendedor | undefined;
    return estado && ESTADOS_PEDIDO_VALIDOS.has(estado) ? estado : undefined;
  }

  private obtenerEstadoPago(valor: string | null): EstadoPagoFiltroVendedor | undefined {
    const estado = valor?.trim().toUpperCase();
    return estado === 'PAGADO' || estado === 'CON_SALDO' ? estado : undefined;
  }

  private obtenerOrden(valor: string | null): OrdenPedidosVendedor {
    const orden = valor?.trim() as OrdenPedidosVendedor | undefined;
    return orden && ORDENES_PEDIDOS_VALIDOS.has(orden) ? orden : ORDEN_PEDIDOS_PREDETERMINADO;
  }
}
