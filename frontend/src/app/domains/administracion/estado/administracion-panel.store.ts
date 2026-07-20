import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, forkJoin, switchMap } from 'rxjs';
import { ProductoApiService } from '../../catalogo/acceso-datos/producto-api.service';
import { obtenerMensajeErrorUsuario } from '../../../core/http/modelos/error-api.model';
import { confirmarAccionCritica } from '../../../shared/utilidades/confirmar-accion.util';
import { DatosMaestrosAdminApiService } from '../acceso-datos/datos-maestros-admin-api.service';
import { PanelAdministracionApiService } from '../acceso-datos/panel-administracion-api.service';
import { DatoMaestroAdmin } from '../modelos/dato-maestro-admin.model';
import {
  PedidoAdministracion,
  TiendaAdministracion,
  UsuarioAdministracion,
  VendedorAdministracion,
} from '../modelos/panel-administracion.model';

@Injectable({ providedIn: 'root' })
export class AdministracionPanelStore {
  private readonly adminApi = inject(PanelAdministracionApiService);
  private readonly datosMaestrosApi = inject(DatosMaestrosAdminApiService);
  private readonly productoApi = inject(ProductoApiService);
  private readonly destroyRef = inject(DestroyRef);
  private resumenCargado = false;

  readonly usuarios = signal<UsuarioAdministracion[]>([]);
  readonly vendedores = signal<VendedorAdministracion[]>([]);
  readonly tiendas = signal<TiendaAdministracion[]>([]);
  readonly tiendasPendientesResumen = signal<TiendaAdministracion[]>([]);
  readonly pedidos = signal<PedidoAdministracion[]>([]);
  readonly datosMaestros = signal<DatoMaestroAdmin[]>([]);
  readonly totalUsuarios = signal(0);
  readonly totalVendedores = signal(0);
  readonly totalTiendas = signal(0);
  readonly totalPedidos = signal(0);
  readonly totalProductosVisibles = signal(0);
  readonly tiendasPendientes = signal(0);
  readonly pedidosConSaldo = signal(0);
  readonly ultimaActualizacion = signal<Date | null>(null);
  readonly cargandoResumen = signal(false);
  readonly cargandoVendedores = signal(false);
  readonly cargandoDatosMaestros = signal(false);
  readonly procesandoTienda = signal<number | null>(null);
  readonly mensajeError = signal<string | null>(null);
  readonly mensajeExito = signal<string | null>(null);

  readonly montoPagado = computed(() =>
    this.pedidos().reduce((total, pedido) => total + pedido.montoPagado, 0),
  );
  readonly datosMaestrosActivos = computed(
    () => this.datosMaestros().filter((dato) => dato.estado).length,
  );
  readonly categoriasDatosMaestros = computed(() =>
    Array.from(new Set(this.datosMaestros().map((dato) => dato.categoria))).sort(),
  );

  cargarResumen(forzar = false): void {
    if (this.resumenCargado && !forzar) return;

    this.cargandoResumen.set(true);
    this.mensajeError.set(null);
    this.mensajeExito.set(null);

    forkJoin({
      usuarios: this.adminApi.obtenerUsuarios({ size: 6 }),
      vendedores: this.adminApi.obtenerVendedores({ size: 6 }),
      tiendas: this.adminApi.obtenerTiendas({ size: 6 }),
      tiendasPendientes: this.adminApi.obtenerTiendas({
        size: 4,
        estadoRevision: 'PENDIENTE',
      }),
      pedidos: this.adminApi.obtenerPedidos({ size: 6 }),
      pedidosConSaldo: this.adminApi.obtenerPedidos({ size: 1, estadoPago: 'CON_SALDO' }),
      productos: this.productoApi.obtenerProductos({
        size: 1,
        soloDisponibles: false,
      }),
    })
      .pipe(
        finalize(() => this.cargandoResumen.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({
          usuarios,
          vendedores,
          tiendas,
          tiendasPendientes,
          pedidos,
          pedidosConSaldo,
          productos,
        }) => {
          this.usuarios.set(usuarios.contenido);
          this.vendedores.set(vendedores.contenido);
          this.tiendas.set(tiendas.contenido);
          this.tiendasPendientesResumen.set(tiendasPendientes.contenido);
          this.pedidos.set(pedidos.contenido);
          this.totalUsuarios.set(usuarios.totalElementos);
          this.totalVendedores.set(vendedores.totalElementos);
          this.totalTiendas.set(tiendas.totalElementos);
          this.totalPedidos.set(pedidos.totalElementos);
          this.totalProductosVisibles.set(productos.totalElementos);
          this.tiendasPendientes.set(tiendasPendientes.totalElementos);
          this.pedidosConSaldo.set(pedidosConSaldo.totalElementos);
          this.ultimaActualizacion.set(new Date());
          this.resumenCargado = true;
        },
        error: (error: unknown) => this.mensajeError.set(this.obtenerMensajeError(error)),
      });
  }

  cargarVendedores(): void {
    this.cargandoVendedores.set(true);
    this.mensajeError.set(null);

    this.adminApi
      .obtenerVendedores({ size: 24 })
      .pipe(
        finalize(() => this.cargandoVendedores.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (pagina) => {
          this.vendedores.set(pagina.contenido);
          this.totalVendedores.set(pagina.totalElementos);
        },
        error: (error: unknown) => this.mensajeError.set(this.obtenerMensajeError(error)),
      });
  }

  cargarDatosMaestros(): void {
    this.cargandoDatosMaestros.set(true);
    this.mensajeError.set(null);

    this.datosMaestrosApi
      .obtenerDatosMaestros()
      .pipe(
        finalize(() => this.cargandoDatosMaestros.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (datos) => this.datosMaestros.set(datos),
        error: (error: unknown) => this.mensajeError.set(this.obtenerMensajeError(error)),
      });
  }

  cambiarEstadoTienda(
    tienda: TiendaAdministracion,
    accion: 'aprobar' | 'observar' | 'rechazar',
  ): void {
    const acciones = {
      aprobar: 'aprobar',
      observar: 'marcar como observada',
      rechazar: 'rechazar',
    };

    if (!confirmarAccionCritica(`Vas a ${acciones[accion]} la tienda "${tienda.nombre}".`)) return;

    this.procesandoTienda.set(tienda.idTienda);
    this.mensajeError.set(null);
    this.mensajeExito.set(null);

    const operacion =
      accion === 'aprobar'
        ? this.adminApi.aprobarTienda(tienda.idTienda)
        : accion === 'observar'
          ? this.adminApi.observarTienda(tienda.idTienda)
          : this.adminApi.rechazarTienda(tienda.idTienda);

    // La moderacion se persiste y luego se recarga el resumen para mantener metricas coherentes.
    operacion
      .pipe(
        switchMap(() =>
          forkJoin({
            tiendas: this.adminApi.obtenerTiendas({ size: 6 }),
            pendientes: this.adminApi.obtenerTiendas({
              size: 4,
              estadoRevision: 'PENDIENTE',
            }),
          }),
        ),
        finalize(() => this.procesandoTienda.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ tiendas, pendientes }) => {
          this.tiendas.set(tiendas.contenido);
          this.tiendasPendientesResumen.set(pendientes.contenido);
          this.totalTiendas.set(tiendas.totalElementos);
          this.tiendasPendientes.set(pendientes.totalElementos);
          this.ultimaActualizacion.set(new Date());
          this.mensajeExito.set('Estado de tienda actualizado correctamente.');
        },
        error: (error: unknown) => this.mensajeError.set(this.obtenerMensajeError(error)),
      });
  }

  limpiarMensajes(): void {
    this.mensajeError.set(null);
    this.mensajeExito.set(null);
  }

  private obtenerMensajeError(error: unknown): string {
    return obtenerMensajeErrorUsuario(error, 'No pudimos cargar la informacion administrativa.');
  }
}
