import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { EstadoPantallaComponent } from '../../../../shared/ui/estado-pantalla/estado-pantalla';
import { InsigniaUi } from '../../../../shared/ui/insignia-ui/insignia-ui';
import { PagoPedidoRecibido, PedidoRecibidoDetalle } from '../../modelos/vendedor.model';
import {
  formatearFechaCalendario,
  obtenerPresentacionEstadoPago,
  obtenerPresentacionEstadoPedido,
  obtenerPresentacionPagoPedido,
  obtenerPrioridadPedido,
} from '../../presentacion/pedido-vendedor.presentacion';

@Component({
  selector: 'app-detalle-pedido-vendedor',
  imports: [CurrencyPipe, DatePipe, EstadoPantallaComponent, InsigniaUi],
  templateUrl: './detalle-pedido-vendedor.html',
  styleUrl: './detalle-pedido-vendedor.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetallePedidoVendedor {
  readonly pedido = input<PedidoRecibidoDetalle | null>(null);
  readonly cargando = input(false);
  readonly mensajeError = input<string | null>(null);
  readonly mostrarCerrar = input(true);

  readonly cerrar = output<void>();
  readonly reintentar = output<void>();

  readonly estadoPresentado = computed(() =>
    obtenerPresentacionEstadoPedido(this.pedido()?.estadoPedido ?? ''),
  );
  readonly pagoPresentado = computed(() => {
    const pedido = this.pedido();
    return pedido
      ? obtenerPresentacionPagoPedido(pedido)
      : { etiqueta: 'Sin información', variante: 'neutral' as const };
  });
  readonly prioridadPresentada = computed(() => {
    const pedido = this.pedido();
    return pedido
      ? obtenerPrioridadPedido(pedido)
      : { nivel: 'seguimiento' as const, etiqueta: 'Seguimiento', mensaje: '' };
  });

  presentacionEstadoPago(pago: PagoPedidoRecibido) {
    return obtenerPresentacionEstadoPago(pago.estadoPago);
  }

  formatearFechaEntrega(fecha: string): string {
    return formatearFechaCalendario(fecha);
  }
}
