import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { combineLatest, finalize, map, Observable } from 'rxjs';
import { obtenerMensajeErrorUsuario } from '../../../../core/http/modelos/error-api.model';
import { BotonDirective } from '../../../../shared/directivas/boton.directive';
import { EstadoPantallaComponent } from '../../../../shared/ui/estado-pantalla/estado-pantalla';
import { FilaPanelComponent } from '../../../../shared/ui/fila-panel/fila-panel';
import { InsigniaUi, VarianteInsignia } from '../../../../shared/ui/insignia-ui/insignia-ui';
import { ListaPanelComponent } from '../../../../shared/ui/lista-panel/lista-panel';
import { TarjetaInformativa } from '../../../../shared/ui/tarjeta-informativa/tarjeta-informativa';
import { PanelAdministracionApiService } from '../../acceso-datos/panel-administracion-api.service';
import {
  PedidoAdministracion,
  TiendaAdministracion,
  VendedorAdministracion,
} from '../../modelos/panel-administracion.model';

type TipoDetalleAdministracion = 'vendedor' | 'tienda' | 'pedido';

interface SolicitudDetalleAdministracion {
  tipo: TipoDetalleAdministracion;
  id: number;
}

type DetalleAdministracion =
  | { tipo: 'vendedor'; datos: VendedorAdministracion }
  | { tipo: 'tienda'; datos: TiendaAdministracion }
  | { tipo: 'pedido'; datos: PedidoAdministracion };

const CONFIGURACION_DETALLE = {
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

    this.obtenerDetalle(solicitud)
      .pipe(
        finalize(() => this.cargando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (detalle) => this.detalle.set(detalle),
        error: (error: unknown) =>
          this.mensajeError.set(
            obtenerMensajeErrorUsuario(error, 'No pudimos cargar el detalle solicitado.'),
          ),
      });
  }

  varianteEstadoGeneral(estado: boolean): VarianteInsignia {
    return estado ? 'exito' : 'error';
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

  private obtenerDetalle(
    solicitud: SolicitudDetalleAdministracion,
  ): Observable<DetalleAdministracion> {
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
    return valor === 'vendedor' || valor === 'tienda' || valor === 'pedido';
  }
}
