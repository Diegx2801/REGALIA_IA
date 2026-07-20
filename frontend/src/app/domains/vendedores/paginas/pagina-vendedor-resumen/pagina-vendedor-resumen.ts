import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgbProgressbar, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { BotonDirective } from '../../../../shared/directivas/boton.directive';
import { EstadoPantallaComponent } from '../../../../shared/ui/estado-pantalla/estado-pantalla';
import { TarjetaMetricaComponent } from '../../../../shared/ui/tarjeta-metrica/tarjeta-metrica';
import { VendedorPanelStore } from '../../estado/vendedor-panel.store';
import { obtenerPresentacionEstadoPedido } from '../../presentacion/pedido-vendedor.presentacion';

@Component({
  selector: 'app-pagina-vendedor-resumen',
  imports: [
    CurrencyPipe,
    DatePipe,
    RouterLink,
    NgbProgressbar,
    NgbTooltip,
    BotonDirective,
    EstadoPantallaComponent,
    TarjetaMetricaComponent,
  ],
  templateUrl: './pagina-vendedor-resumen.html',
  styleUrl: './pagina-vendedor-resumen.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaVendedorResumen implements OnInit {
  readonly store = inject(VendedorPanelStore);

  readonly nombreOperador = computed(() => {
    const nombreCompleto = this.store.perfil()?.nombreCompleto?.trim();
    return nombreCompleto ? nombreCompleto.split(' ')[0] : 'vendedor';
  });

  /** Tienda cuyo inventario alimenta los indicadores de catálogo de esta vista. */
  readonly tiendaEnFoco = computed(
    () => this.store.tiendaSeleccionada() ?? this.store.tiendas()[0] ?? null,
  );

  readonly rutaCentroTienda = computed(() => {
    const tienda = this.tiendaEnFoco();
    return tienda ? ['/vendedor/tiendas', tienda.idTienda] : ['/vendedor/tiendas'];
  });

  readonly rutaNuevoProducto = computed(() => {
    const tienda = this.tiendaEnFoco();
    return tienda
      ? ['/vendedor/tiendas', tienda.idTienda, 'productos', 'nuevo']
      : ['/vendedor/tiendas'];
  });

  readonly stockDisponible = computed(() =>
    this.store.productos().reduce((total, producto) => total + Math.max(producto.stock, 0), 0),
  );

  readonly totalGestionado = computed(() => this.store.totalPagado() + this.store.saldoPendiente());

  readonly porcentajeCobrado = computed(() => {
    const totalGestionado = this.totalGestionado();
    if (totalGestionado <= 0) return 0;

    // Se calcula con pedidos reales recibidos; no representa una meta comercial inventada.
    return Math.round((this.store.totalPagado() / totalGestionado) * 100);
  });

  readonly descripcionTiendas = computed(() => {
    const pendientes = this.store.tiendasPendientesRevision();
    if (pendientes === 0) return 'Sin revisiones pendientes.';
    return pendientes === 1
      ? '1 tienda pendiente de revisión.'
      : `${pendientes} tiendas pendientes de revisión.`;
  });

  readonly descripcionStock = computed(() => {
    const unidades = this.stockDisponible();
    const alcance = this.tiendaEnFoco()?.nombre ?? 'la tienda en foco';
    return unidades === 1
      ? `1 unidad disponible en ${alcance}.`
      : `${unidades} unidades disponibles en ${alcance}.`;
  });

  readonly descripcionPedidos = computed(() => {
    const pendientes = this.store.pedidosPendientes();
    if (pendientes === 0) return 'Sin saldos en los últimos 5 pedidos.';
    return pendientes === 1
      ? '1 de los últimos 5 pedidos tiene saldo.'
      : `${pendientes} de los últimos 5 pedidos tienen saldo.`;
  });

  etiquetaEstadoPedido(estado: string): string {
    return obtenerPresentacionEstadoPedido(estado).etiqueta;
  }

  ngOnInit(): void {
    this.store.cargarPanel();
  }
}
