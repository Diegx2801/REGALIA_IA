import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, effect, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { obtenerMensajeErrorUsuario } from '../../../../core/http/modelos/error-api.model';
import { BotonDirective } from '../../../../shared/directivas/boton.directive';
import { EstadoPantallaComponent } from '../../../../shared/ui/estado-pantalla/estado-pantalla';
import { FilaPanelComponent } from '../../../../shared/ui/fila-panel/fila-panel';
import { ListaPanelComponent } from '../../../../shared/ui/lista-panel/lista-panel';
import { CheckoutApiService } from '../../../checkout/acceso-datos/checkout-api.service';
import { PedidosClienteStore } from '../../estado/pedidos-cliente.store';
import { obtenerEtiquetaEstadoPedidoCliente } from '../../modelos/pedido-cliente.model';

type EstadoMensajePago = 'exito' | 'advertencia' | 'error';

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
  readonly estadoMensajePago = signal<EstadoMensajePago | null>(null);
  private readonly estadoRetornoPago = signal<string | null>(null);

  constructor() {
    effect(() => {
      const pedido = this.store.pedidoDetalle();
      const estadoPago = this.estadoRetornoPago();

      if (!pedido || !estadoPago) return;

      this.mensajePago.set(this.obtenerMensajeRetornoPago(estadoPago, pedido.saldoPendiente));
      this.estadoMensajePago.set(this.obtenerEstadoMensajeRetornoPago(estadoPago, pedido.saldoPendiente));
      this.estadoRetornoPago.set(null);
      void this.limpiarParametrosRetornoPago();
    });
  }

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

      this.estadoRetornoPago.set(parametros.get('payment') ?? 'success');
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
    this.estadoMensajePago.set(null);

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
            this.estadoMensajePago.set('error');
            return;
          }

          window.location.assign(resultado.urlRedireccion);
        },
        error: (error: unknown) => {
          this.mensajePago.set(
            obtenerMensajeErrorUsuario(error, 'No pudimos preparar tu pago. Inténtalo nuevamente.'),
          );
          this.estadoMensajePago.set('error');
        },
      });
  }

  private limpiarParametrosRetornoPago(): Promise<boolean> {
    return this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        checkout: null,
        payment: null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private obtenerMensajeRetornoPago(estadoPago: string, saldoPendiente: number): string {
    if (estadoPago === 'success' && saldoPendiente <= 0) {
      return 'Pago confirmado. Tu saldo está al día.';
    }

    if (estadoPago === 'failure') {
      return 'El pago no se completó. Puedes intentarlo nuevamente cuando estés listo.';
    }

    if (estadoPago === 'pending') {
      return 'Tu pago está pendiente de confirmación. Actualizaremos el saldo cuando la pasarela lo confirme.';
    }

    return 'Estamos verificando tu pago. El saldo se actualizará cuando la pasarela lo confirme.';
  }

  private obtenerEstadoMensajeRetornoPago(
    estadoPago: string,
    saldoPendiente: number,
  ): EstadoMensajePago {
    if (estadoPago === 'success' && saldoPendiente <= 0) return 'exito';
    if (estadoPago === 'failure') return 'error';

    return 'advertencia';
  }
}
