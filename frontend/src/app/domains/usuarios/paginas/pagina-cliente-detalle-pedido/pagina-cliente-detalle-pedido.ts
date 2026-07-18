import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { obtenerMensajeErrorUsuario } from '../../../../core/http/modelos/error-api.model';
import { BotonDirective } from '../../../../shared/directivas/boton.directive';
import { EstadoPantallaComponent } from '../../../../shared/ui/estado-pantalla/estado-pantalla';
import { FilaPanelComponent } from '../../../../shared/ui/fila-panel/fila-panel';
import { ListaPanelComponent } from '../../../../shared/ui/lista-panel/lista-panel';
import { PedidosClienteStore } from '../../estado/pedidos-cliente.store';
import { obtenerEtiquetaEstadoPedidoCliente } from '../../modelos/pedido-cliente.model';
import { CheckoutApiService } from '../../../checkout/acceso-datos/checkout-api.service';

@Component({
  selector: 'app-pagina-cliente-detalle-pedido',
  imports: [
    CurrencyPipe,
    DatePipe,
    RouterLink,
    BotonDirective,
    EstadoPantallaComponent,
    FilaPanelComponent,
    ListaPanelComponent,
  ],
  templateUrl: './pagina-cliente-detalle-pedido.html',
  styleUrl: './pagina-cliente-detalle-pedido.css',
})
export class PaginaClienteDetallePedido implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly store = inject(PedidosClienteStore);
  private readonly checkoutApi = inject(CheckoutApiService);
  readonly preparandoPago = signal(false);
  readonly mensajePago = signal<string | null>(null);

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((parametros) => {
      const idPedido = Number(parametros.get('idPedido'));

      if (!Number.isInteger(idPedido) || idPedido <= 0) {
        void this.router.navigate(['/cliente/pedidos']);
        return;
      }

      this.store.cargarDetalle(idPedido);
    });

    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((parametros) => {
      if (parametros.get('checkout') !== 'confirmacion') return;

      const estadoPago = parametros.get('payment');
      this.mensajePago.set(this.obtenerMensajeRetornoPago(estadoPago));
    });
  }

  recargarDetalle(): void {
    const idPedido = this.store.pedidoDetalle()?.idPedido ?? Number(this.route.snapshot.paramMap.get('idPedido'));
    if (Number.isInteger(idPedido) && idPedido > 0) this.store.cargarDetalle(idPedido);
  }

  etiquetaEstado(estado: string): string {
    return obtenerEtiquetaEstadoPedidoCliente(estado);
  }

  pagarSaldoPendiente(idPedido: number): void {
    this.preparandoPago.set(true);
    this.mensajePago.set(null);

    this.checkoutApi
      .crearSesionPagoRestante(idPedido)
      .pipe(
        finalize(() => this.preparandoPago.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (resultado) => {
          if (!resultado.urlRedireccion) {
            this.mensajePago.set('No pudimos abrir el proveedor de pago. Inténtalo nuevamente.');
            return;
          }

          window.location.assign(resultado.urlRedireccion);
        },
        error: (error: unknown) =>
          this.mensajePago.set(
            obtenerMensajeErrorUsuario(error, 'No pudimos preparar tu pago. Inténtalo nuevamente.'),
          ),
      });
  }

  private obtenerMensajeRetornoPago(estadoPago: string | null): string {
    if (estadoPago === 'failure') {
      return 'El pago no se completó. Puedes intentarlo nuevamente cuando estés listo.';
    }

    if (estadoPago === 'pending') {
      return 'Tu pago está pendiente de confirmación. Actualizaremos el saldo cuando la pasarela lo confirme.';
    }

    return 'Estamos verificando tu pago. El saldo se actualizará cuando la pasarela lo confirme.';
  }
}
