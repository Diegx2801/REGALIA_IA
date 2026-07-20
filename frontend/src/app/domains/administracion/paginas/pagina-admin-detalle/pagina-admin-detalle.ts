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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { combineLatest, finalize, map, Observable } from 'rxjs';
import { obtenerMensajeErrorUsuario } from '../../../../core/http/modelos/error-api.model';
import { BotonDirective } from '../../../../shared/directivas/boton.directive';
import { confirmarAccionCritica } from '../../../../shared/utilidades/confirmar-accion.util';
import { EstadoPantallaComponent } from '../../../../shared/ui/estado-pantalla/estado-pantalla';
import { FilaPanelComponent } from '../../../../shared/ui/fila-panel/fila-panel';
import { InsigniaUi, VarianteInsignia } from '../../../../shared/ui/insignia-ui/insignia-ui';
import { ListaPanelComponent } from '../../../../shared/ui/lista-panel/lista-panel';
import { TarjetaInformativa } from '../../../../shared/ui/tarjeta-informativa/tarjeta-informativa';
import { PanelAdministracionApiService } from '../../acceso-datos/panel-administracion-api.service';
import {
  PedidoAdministracion,
  ProductoCatalogoTiendaAdministracion,
  TiendaAdministracion,
  UsuarioAdministracion,
  VendedorAdministracion,
} from '../../modelos/panel-administracion.model';

type TipoDetalleAdministracion = 'usuario' | 'vendedor' | 'tienda' | 'pedido';
type AccionModeracionTienda = 'aprobar' | 'observar' | 'rechazar';
type EstadoEtapaPedido = 'completada' | 'actual' | 'pendiente' | 'anulada';

interface SolicitudDetalleAdministracion {
  tipo: TipoDetalleAdministracion;
  id: number;
}

type DetalleAdministracion =
  | { tipo: 'usuario'; datos: UsuarioAdministracion }
  | { tipo: 'vendedor'; datos: VendedorAdministracion }
  | { tipo: 'tienda'; datos: TiendaAdministracion }
  | { tipo: 'pedido'; datos: PedidoAdministracion };

const CONFIGURACION_DETALLE = {
  usuario: {
    parametro: 'idUsuario',
    rutaRegreso: '/admin/usuarios',
    textoRegreso: 'Volver a usuarios',
  },
  vendedor: {
    parametro: 'idVendedor',
    rutaRegreso: '/admin/vendedores',
    textoRegreso: 'Volver a vendedores',
  },
  tienda: {
    parametro: 'idTienda',
    rutaRegreso: '/admin/tiendas',
    textoRegreso: 'Volver a tiendas',
  },
  pedido: {
    parametro: 'idPedido',
    rutaRegreso: '/admin/pedidos',
    textoRegreso: 'Volver a pedidos',
  },
} as const satisfies Record<
  TipoDetalleAdministracion,
  { parametro: string; rutaRegreso: string; textoRegreso: string }
>;

@Component({
  selector: 'app-pagina-admin-detalle',
  imports: [
    CurrencyPipe,
    DatePipe,
    RouterLink,
    BotonDirective,
    EstadoPantallaComponent,
    FilaPanelComponent,
    InsigniaUi,
    ListaPanelComponent,
    TarjetaInformativa,
  ],
  templateUrl: './pagina-admin-detalle.html',
  styleUrl: './pagina-admin-detalle.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaAdminDetalle implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly adminApi = inject(PanelAdministracionApiService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly solicitud = signal<SolicitudDetalleAdministracion | null>(null);
  readonly detalle = signal<DetalleAdministracion | null>(null);
  readonly cargando = signal(true);
  readonly mensajeError = signal<string | null>(null);
  readonly productosTienda = signal<ProductoCatalogoTiendaAdministracion[]>([]);
  readonly cargandoCatalogoTienda = signal(false);
  readonly mensajeErrorCatalogoTienda = signal<string | null>(null);
  readonly procesandoTienda = signal<AccionModeracionTienda | null>(null);
  readonly mensajeModeracionTienda = signal<string | null>(null);
  readonly mensajeErrorModeracionTienda = signal<string | null>(null);
  readonly procesandoUsuario = signal(false);
  readonly mensajeEstadoUsuario = signal<string | null>(null);
  readonly mensajeErrorEstadoUsuario = signal<string | null>(null);
  readonly etapasPedido = [
    { codigo: 'RESERVADO', etiqueta: 'Reservado' },
    { codigo: 'EN_PREPARACION', etiqueta: 'En preparación' },
    { codigo: 'LISTO', etiqueta: 'Listo' },
    { codigo: 'ENTREGADO', etiqueta: 'Entregado' },
  ] as const;

  readonly usuario = computed(() => {
    const detalle = this.detalle();
    return detalle?.tipo === 'usuario' ? detalle.datos : null;
  });
  readonly vendedor = computed(() => {
    const detalle = this.detalle();
    return detalle?.tipo === 'vendedor' ? detalle.datos : null;
  });
  readonly tienda = computed(() => {
    const detalle = this.detalle();
    return detalle?.tipo === 'tienda' ? detalle.datos : null;
  });
  readonly pedido = computed(() => {
    const detalle = this.detalle();
    return detalle?.tipo === 'pedido' ? detalle.datos : null;
  });
  readonly rutaRegreso = computed(() => {
    const tipo = this.solicitud()?.tipo;
    return tipo ? CONFIGURACION_DETALLE[tipo].rutaRegreso : '/admin';
  });
  readonly textoRegreso = computed(() => {
    const tipo = this.solicitud()?.tipo;
    return tipo ? CONFIGURACION_DETALLE[tipo].textoRegreso : 'Volver al panel';
  });

  ngOnInit(): void {
    combineLatest([this.route.data, this.route.paramMap])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([datosRuta, parametros]) => {
        const tipo = datosRuta['tipoDetalle'];
        if (!this.esTipoDetalle(tipo)) {
          void this.router.navigate(['/admin']);
          return;
        }

        const id = Number(parametros.get(CONFIGURACION_DETALLE[tipo].parametro));
        if (!Number.isInteger(id) || id <= 0) {
          void this.router.navigate([CONFIGURACION_DETALLE[tipo].rutaRegreso]);
          return;
        }

        this.solicitud.set({ tipo, id });
        this.cargarDetalle();
      });
  }

  cargarDetalle(): void {
    const solicitud = this.solicitud();
    if (!solicitud) return;

    this.cargando.set(true);
    this.mensajeError.set(null);
    this.detalle.set(null);
    this.productosTienda.set([]);
    this.mensajeErrorCatalogoTienda.set(null);
    this.mensajeModeracionTienda.set(null);
    this.mensajeErrorModeracionTienda.set(null);
    this.mensajeEstadoUsuario.set(null);
    this.mensajeErrorEstadoUsuario.set(null);

    this.obtenerDetalle(solicitud)
      .pipe(
        finalize(() => this.cargando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (detalle) => {
          this.detalle.set(detalle);
          if (detalle.tipo === 'tienda' && this.tiendaTieneCatalogoPublico(detalle.datos)) {
            this.cargarCatalogoTienda(detalle.datos.idTienda);
          }
        },
        error: (error: unknown) =>
          this.mensajeError.set(
            obtenerMensajeErrorUsuario(error, 'No pudimos cargar el detalle solicitado.'),
          ),
      });
  }

  varianteEstadoGeneral(estado: boolean): VarianteInsignia {
    return estado ? 'exito' : 'error';
  }

  cambiarEstadoUsuario(): void {
    const usuario = this.usuario();
    if (!usuario) return;

    const accion = usuario.estado ? 'desactivar' : 'reactivar';
    const consecuencia = usuario.estado
      ? 'La cuenta perderá el acceso hasta que sea reactivada.'
      : 'La cuenta recuperará el acceso a REGALIA.';
    if (
      !confirmarAccionCritica(
        `Vas a ${accion} la cuenta de "${usuario.nombreCompleto}". ${consecuencia}`,
      )
    ) {
      return;
    }

    this.procesandoUsuario.set(true);
    this.mensajeEstadoUsuario.set(null);
    this.mensajeErrorEstadoUsuario.set(null);

    const operacion = usuario.estado
      ? this.adminApi.desactivarUsuario(usuario.idUsuario)
      : this.adminApi.reactivarUsuario(usuario.idUsuario);

    operacion
      .pipe(
        finalize(() => this.procesandoUsuario.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (usuarioActualizado) => {
          this.detalle.set({ tipo: 'usuario', datos: usuarioActualizado });
          this.mensajeEstadoUsuario.set(
            `La cuenta de ${usuarioActualizado.nombreCompleto} fue ${
              usuarioActualizado.estado ? 'reactivada' : 'desactivada'
            }.`,
          );
        },
        error: (error: unknown) =>
          this.mensajeErrorEstadoUsuario.set(
            obtenerMensajeErrorUsuario(error, 'No pudimos actualizar el estado de la cuenta.'),
          ),
      });
  }

  varianteRevisionTienda(estadoRevision: string): VarianteInsignia {
    if (estadoRevision === 'APROBADA') return 'exito';
    if (estadoRevision === 'RECHAZADA') return 'error';
    if (estadoRevision === 'OBSERVADA') return 'advertencia';
    return 'neutral';
  }

  varianteEstadoPedido(estadoPedido: string): VarianteInsignia {
    if (['COMPLETADO', 'ENTREGADO', 'PAGADO'].includes(estadoPedido)) return 'exito';
    if (['CANCELADO', 'RECHAZADO'].includes(estadoPedido)) return 'error';
    return 'advertencia';
  }

  estadoEtapaPedido(estadoActual: string, codigoEtapa: string): EstadoEtapaPedido {
    if (estadoActual === 'ANULADO') return 'anulada';
    const indiceActual = this.etapasPedido.findIndex((etapa) => etapa.codigo === estadoActual);
    const indiceEtapa = this.etapasPedido.findIndex((etapa) => etapa.codigo === codigoEtapa);
    if (indiceEtapa < indiceActual) return 'completada';
    if (indiceEtapa === indiceActual) return 'actual';
    return 'pendiente';
  }

  prioridadPedido(pedido: PedidoAdministracion): 'alta' | 'media' | 'normal' | 'cerrada' {
    if (pedido.estadoPedido === 'ENTREGADO' || pedido.estadoPedido === 'ANULADO') return 'cerrada';
    if (this.estaEntregaPedidoVencida(pedido)) return 'alta';
    if (pedido.saldoPendiente > 0) return 'media';
    return 'normal';
  }

  etiquetaPrioridadPedido(pedido: PedidoAdministracion): string {
    const etiquetas = {
      alta: 'Atención inmediata',
      media: 'Requiere seguimiento',
      normal: 'Operación al día',
      cerrada: 'Ciclo cerrado',
    } as const;
    return etiquetas[this.prioridadPedido(pedido)];
  }

  estaEntregaPedidoVencida(pedido: PedidoAdministracion): boolean {
    if (
      !pedido.fechaEntrega ||
      pedido.estadoPedido === 'ENTREGADO' ||
      pedido.estadoPedido === 'ANULADO'
    ) {
      return false;
    }
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    return pedido.fechaEntrega < `${anio}-${mes}-${dia}`;
  }

  moderarTienda(accion: AccionModeracionTienda): void {
    const tienda = this.tienda();
    if (!tienda || !this.confirmarModeracionTienda(tienda, accion)) return;

    this.procesandoTienda.set(accion);
    this.mensajeModeracionTienda.set(null);
    this.mensajeErrorModeracionTienda.set(null);

    const operacion =
      accion === 'aprobar'
        ? this.adminApi.aprobarTienda(tienda.idTienda)
        : accion === 'observar'
          ? this.adminApi.observarTienda(tienda.idTienda)
          : this.adminApi.rechazarTienda(tienda.idTienda);

    operacion
      .pipe(
        finalize(() => this.procesandoTienda.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (tiendaActualizada) => {
          this.detalle.set({ tipo: 'tienda', datos: tiendaActualizada });
          this.mensajeModeracionTienda.set(
            `${tiendaActualizada.nombre} ahora está ${tiendaActualizada.estadoRevision.toLowerCase()}.`,
          );
          if (this.tiendaTieneCatalogoPublico(tiendaActualizada)) {
            this.cargarCatalogoTienda(tiendaActualizada.idTienda);
          } else {
            this.productosTienda.set([]);
            this.mensajeErrorCatalogoTienda.set(null);
          }
        },
        error: (error: unknown) =>
          this.mensajeErrorModeracionTienda.set(
            obtenerMensajeErrorUsuario(error, 'No pudimos actualizar el estado de la tienda.'),
          ),
      });
  }

  private cargarCatalogoTienda(idTienda: number): void {
    this.cargandoCatalogoTienda.set(true);
    this.mensajeErrorCatalogoTienda.set(null);

    this.adminApi
      .obtenerCatalogoPublicoTienda(idTienda)
      .pipe(
        finalize(() => this.cargandoCatalogoTienda.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (productos) => this.productosTienda.set(productos),
        error: (error: unknown) =>
          this.mensajeErrorCatalogoTienda.set(
            obtenerMensajeErrorUsuario(
              error,
              'No pudimos cargar el catálogo público de la tienda.',
            ),
          ),
      });
  }

  private tiendaTieneCatalogoPublico(tienda: TiendaAdministracion): boolean {
    return tienda.estado && tienda.estadoRevision === 'APROBADA';
  }

  private confirmarModeracionTienda(
    tienda: TiendaAdministracion,
    accion: AccionModeracionTienda,
  ): boolean {
    const consecuencias: Record<AccionModeracionTienda, string> = {
      aprobar: 'Su estado comercial pasará a APROBADA.',
      observar: 'Quedará marcada como OBSERVADA para revisión.',
      rechazar: 'Su estado comercial pasará a RECHAZADA.',
    };
    return confirmarAccionCritica(
      `Vas a ${accion} la tienda "${tienda.nombre}". ${consecuencias[accion]}`,
    );
  }

  private obtenerDetalle(
    solicitud: SolicitudDetalleAdministracion,
  ): Observable<DetalleAdministracion> {
    if (solicitud.tipo === 'usuario') {
      return this.adminApi
        .obtenerUsuarioPorId(solicitud.id)
        .pipe(map((datos) => ({ tipo: 'usuario' as const, datos })));
    }

    if (solicitud.tipo === 'vendedor') {
      return this.adminApi
        .obtenerVendedorPorId(solicitud.id)
        .pipe(map((datos) => ({ tipo: 'vendedor' as const, datos })));
    }

    if (solicitud.tipo === 'tienda') {
      return this.adminApi
        .obtenerTiendaPorId(solicitud.id)
        .pipe(map((datos) => ({ tipo: 'tienda' as const, datos })));
    }

    return this.adminApi
      .obtenerPedidoPorId(solicitud.id)
      .pipe(map((datos) => ({ tipo: 'pedido' as const, datos })));
  }

  private esTipoDetalle(valor: unknown): valor is TipoDetalleAdministracion {
    return valor === 'usuario' || valor === 'vendedor' || valor === 'tienda' || valor === 'pedido';
  }
}
