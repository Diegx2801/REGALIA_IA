import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, forkJoin, switchMap } from 'rxjs';
import { ProductoApiService } from '../../../catalogo/acceso-datos/producto-api.service';
import { obtenerMensajeErrorUsuario } from '../../../../core/http/modelos/error-api.model';
import { BotonDirective } from '../../../../shared/directivas/boton.directive';
import { confirmarAccionCritica } from '../../../../shared/utilidades/confirmar-accion.util';
import { EstadoPantallaComponent } from '../../../../shared/ui/estado-pantalla/estado-pantalla';
import { FilaPanelComponent } from '../../../../shared/ui/fila-panel/fila-panel';
import { ListaPanelComponent } from '../../../../shared/ui/lista-panel/lista-panel';
import { TarjetaMetricaComponent } from '../../../../shared/ui/tarjeta-metrica/tarjeta-metrica';
import { PanelAdministracionApiService } from '../../acceso-datos/panel-administracion-api.service';
import {
  PedidoAdministracion,
  TiendaAdministracion,
  UsuarioAdministracion,
  VendedorAdministracion,
} from '../../modelos/panel-administracion.model';

@Component({
  selector: 'app-pagina-panel-administracion',
  imports: [
    CurrencyPipe,
    DatePipe,
    BotonDirective,
    EstadoPantallaComponent,
    FilaPanelComponent,
    ListaPanelComponent,
    TarjetaMetricaComponent,
  ],
  templateUrl: './pagina-panel-administracion.html',
  styleUrl: './pagina-panel-administracion.css',
})
export class PaginaPanelAdministracion implements OnInit {
  private readonly adminApi = inject(PanelAdministracionApiService);
  private readonly productoApi = inject(ProductoApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly usuarios = signal<UsuarioAdministracion[]>([]);
  readonly vendedores = signal<VendedorAdministracion[]>([]);
  readonly tiendas = signal<TiendaAdministracion[]>([]);
  readonly pedidos = signal<PedidoAdministracion[]>([]);
  readonly totalUsuarios = signal(0);
  readonly totalVendedores = signal(0);
  readonly totalTiendas = signal(0);
  readonly totalPedidos = signal(0);
  readonly totalProductosVisibles = signal(0);
  readonly cargando = signal(true);
  readonly procesandoTienda = signal<number | null>(null);
  readonly mensajeError = signal<string | null>(null);
  readonly mensajeExito = signal<string | null>(null);

  readonly tiendasPendientes = computed(
    () => this.tiendas().filter((tienda) => tienda.estadoRevision === 'PENDIENTE').length,
  );
  readonly pedidosConSaldo = computed(
    () => this.pedidos().filter((pedido) => pedido.saldoPendiente > 0).length,
  );
  readonly montoPagado = computed(() =>
    this.pedidos().reduce((total, pedido) => total + pedido.montoPagado, 0),
  );

  ngOnInit(): void {
    this.cargarPanel();
  }

  cargarPanel(): void {
    this.cargando.set(true);
    this.mensajeError.set(null);
    this.mensajeExito.set(null);

    forkJoin({
      usuarios: this.adminApi.obtenerUsuarios({ size: 5 }),
      vendedores: this.adminApi.obtenerVendedores(),
      tiendas: this.adminApi.obtenerTiendas({ size: 6 }),
      pedidos: this.adminApi.obtenerPedidos({ size: 6 }),
      productos: this.productoApi.obtenerProductos(),
    })
      .pipe(
        finalize(() => this.cargando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ usuarios, vendedores, tiendas, pedidos, productos }) => {
          this.usuarios.set(usuarios.contenido);
          this.vendedores.set(vendedores.contenido);
          this.tiendas.set(tiendas.contenido);
          this.pedidos.set(pedidos.contenido);
          this.totalUsuarios.set(usuarios.totalElementos);
          this.totalVendedores.set(vendedores.totalElementos);
          this.totalTiendas.set(tiendas.totalElementos);
          this.totalPedidos.set(pedidos.totalElementos);
          this.totalProductosVisibles.set(productos.length);
        },
        error: (error: unknown) => this.mensajeError.set(this.obtenerMensajeError(error)),
      });
  }

  aprobarTienda(tienda: TiendaAdministracion): void {
    this.cambiarEstadoTienda(tienda, 'aprobar');
  }

  observarTienda(tienda: TiendaAdministracion): void {
    this.cambiarEstadoTienda(tienda, 'observar');
  }

  rechazarTienda(tienda: TiendaAdministracion): void {
    this.cambiarEstadoTienda(tienda, 'rechazar');
  }

  private cambiarEstadoTienda(
    tienda: TiendaAdministracion,
    accion: 'aprobar' | 'observar' | 'rechazar',
  ): void {
    if (!this.confirmarModeracionTienda(tienda, accion)) return;

    this.procesandoTienda.set(tienda.idTienda);
    this.mensajeError.set(null);
    this.mensajeExito.set(null);

    const operacion =
      accion === 'aprobar'
        ? this.adminApi.aprobarTienda(tienda.idTienda)
        : accion === 'observar'
          ? this.adminApi.observarTienda(tienda.idTienda)
          : this.adminApi.rechazarTienda(tienda.idTienda);

    // La moderacion se persiste en backend y luego se recarga la pagina admin para mantener metricas coherentes.
    operacion
      .pipe(
        switchMap(() => this.adminApi.obtenerTiendas({ size: 6 })),
        finalize(() => this.procesandoTienda.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (tiendas) => {
          this.tiendas.set(tiendas.contenido);
          this.totalTiendas.set(tiendas.totalElementos);
          this.mensajeExito.set('Estado de tienda actualizado correctamente.');
        },
        error: (error: unknown) => this.mensajeError.set(this.obtenerMensajeError(error)),
      });
  }

  private confirmarModeracionTienda(
    tienda: TiendaAdministracion,
    accion: 'aprobar' | 'observar' | 'rechazar',
  ): boolean {
    const acciones = {
      aprobar: 'aprobar',
      observar: 'marcar como observada',
      rechazar: 'rechazar',
    };

    return confirmarAccionCritica(`Vas a ${acciones[accion]} la tienda "${tienda.nombre}".`);
  }

  private obtenerMensajeError(error: unknown): string {
    return obtenerMensajeErrorUsuario(error, 'No pudimos cargar la informacion administrativa.');
  }
}
