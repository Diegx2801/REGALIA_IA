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
import { finalize } from 'rxjs';
import { obtenerMensajeErrorUsuario } from '../../../../core/http/modelos/error-api.model';
import { BotonDirective } from '../../../../shared/directivas/boton.directive';
import { EstadoPantallaComponent } from '../../../../shared/ui/estado-pantalla/estado-pantalla';
import { CheckoutApiService } from '../../../checkout/acceso-datos/checkout-api.service';
import { PedidoClienteApiService } from '../../acceso-datos/pedido-cliente-api.service';
import { PedidosClienteStore } from '../../estado/pedidos-cliente.store';
import { obtenerEtiquetaEstadoPedidoCliente } from '../../modelos/pedido-cliente.model';

type EstadoMensajePago = 'exito' | 'advertencia' | 'error';
type EstadoPasoSeguimiento = 'completado' | 'actual' | 'pendiente';
type VarianteAlertaPedido = 'informativa' | 'exito' | 'advertencia' | 'error';

@Component({
  selector: 'app-pagina-cliente-detalle-pedido',
  imports: [CurrencyPipe, DatePipe, RouterLink, BotonDirective, EstadoPantallaComponent],
  templateUrl: './pagina-cliente-detalle-pedido.html',
  styleUrl: './pagina-cliente-detalle-pedido.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaClienteDetallePedido implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly checkoutApi = inject(CheckoutApiService);
  private readonly pedidoClienteApi = inject(PedidoClienteApiService);

  readonly store = inject(PedidosClienteStore);
  readonly preparandoPago = signal(false);
  readonly reenviandoCodigoEntrega = signal(false);
  readonly mensajeCodigoEntrega = signal<string | null>(null);
  private readonly mensajePagoAccion = signal<string | null>(null);
  private readonly estadoMensajePagoAccion = signal<EstadoMensajePago | null>(null);
  private readonly estadoRetornoPago = signal<string | null>(null);

  readonly pasosSeguimiento = [
    { estado: 'RESERVADO', etiqueta: 'Reservado', descripcion: 'Compra confirmada' },
    {
      estado: 'EN_PREPARACION',
      etiqueta: 'Preparación',
      descripcion: 'La tienda prepara tu regalo',
    },
    { estado: 'LISTO', etiqueta: 'Listo', descripcion: 'Disponible para la entrega' },
    { estado: 'ENTREGADO', etiqueta: 'Entregado', descripcion: 'Entrega completada' },
  ] as const;

  readonly puedePagarSaldo = computed(() => {
    const pedido = this.store.pedidoDetalle();
    return Boolean(pedido && pedido.saldoPendiente > 0 && pedido.estadoPedido !== 'ANULADO');
  });

  readonly puedeReenviarCodigoEntrega = computed(
    () => {
      const pedido = this.store.pedidoDetalle();
      return Boolean(pedido?.estadoPedido === 'LISTO' && pedido.saldoPendiente <= 0);
    },
  );

  readonly porcentajePagado = computed(() => {
    const pedido = this.store.pedidoDetalle();
    if (!pedido || pedido.total <= 0) return 100;
    return Math.min(100, Math.max(0, Math.round((pedido.montoPagado / pedido.total) * 100)));
  });

  readonly cantidadProductos = computed(
    () =>
      this.store
        .pedidoDetalle()
        ?.productos.reduce((total, producto) => total + producto.cantidad, 0) ?? 0,
  );

  readonly mensajePago = computed(() => {
    const mensajeAccion = this.mensajePagoAccion();
    if (mensajeAccion) return mensajeAccion;

    const pedido = this.store.pedidoDetalle();
    const estadoPago = this.estadoRetornoPago();
    return pedido && estadoPago
      ? this.obtenerMensajeRetornoPago(estadoPago, pedido.saldoPendiente)
      : null;
  });

  readonly estadoMensajePago = computed<EstadoMensajePago | null>(() => {
    const estadoAccion = this.estadoMensajePagoAccion();
    if (estadoAccion) return estadoAccion;

    const pedido = this.store.pedidoDetalle();
    const estadoPago = this.estadoRetornoPago();
    return pedido && estadoPago
      ? this.obtenerEstadoMensajeRetornoPago(estadoPago, pedido.saldoPendiente)
      : null;
  });

  readonly alertaPedido = computed<{
    variante: VarianteAlertaPedido;
    titulo: string;
    descripcion: string;
  } | null>(() => {
    const pedido = this.store.pedidoDetalle();
    if (!pedido) return null;

    if (pedido.estadoPedido === 'ANULADO') {
      return {
        variante: 'error',
        titulo: 'Este pedido fue anulado',
        descripcion:
          'El pago de saldo ya no está disponible. Conserva este detalle como referencia.',
      };
    }
    if (pedido.estadoPedido === 'ENTREGADO') {
      return {
        variante: 'exito',
        titulo: 'Entrega completada',
        descripcion: 'El pedido figura como entregado y permanece disponible en tu historial.',
      };
    }
    if (pedido.estadoPedido === 'LISTO') {
      const tieneSaldoPendiente = pedido.saldoPendiente > 0;
      return {
        variante: tieneSaldoPendiente ? 'advertencia' : 'informativa',
        titulo: tieneSaldoPendiente ? 'Tu regalo está listo' : 'Tu entrega está lista para coordinarse',
        descripcion: tieneSaldoPendiente
          ? 'Completa el saldo pendiente para habilitar la entrega.'
          : `La entrega continuará mediante: ${pedido.tipoEntrega}.`,
      };
    }
    if (pedido.estadoPedido === 'EN_PREPARACION') {
      return {
        variante: 'informativa',
        titulo: 'La tienda está preparando tu regalo',
        descripcion:
          'Revisa aquí el avance y la fecha solicitada mientras se completa la preparación.',
      };
    }

    return {
      variante: 'informativa',
      titulo: 'Reserva confirmada',
      descripcion: 'La tienda recibió tu pedido y el siguiente paso será iniciar la preparación.',
    };
  });

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
      void this.limpiarParametrosRetornoPago();
    });
  }

  recargarDetalle(): void {
    const idPedido =
      this.store.pedidoDetalle()?.idPedido ?? Number(this.route.snapshot.paramMap.get('idPedido'));
    if (Number.isInteger(idPedido) && idPedido > 0) this.store.cargarDetalle(idPedido);
  }

  etiquetaEstado(estado: string): string {
    return obtenerEtiquetaEstadoPedidoCliente(estado);
  }

  estadoPaso(estadoPedido: string, indicePaso: number): EstadoPasoSeguimiento {
    if (estadoPedido === 'ANULADO') return 'pendiente';
    const indiceActual = this.pasosSeguimiento.findIndex((paso) => paso.estado === estadoPedido);
    if (indiceActual < 0 || indicePaso > indiceActual) return 'pendiente';
    return indicePaso === indiceActual ? 'actual' : 'completado';
  }

  pagarSaldoPendiente(idPedido: number): void {
    const pedido = this.store.pedidoDetalle();
    if (!pedido || pedido.idPedido !== idPedido || !this.puedePagarSaldo()) {
      this.mensajePagoAccion.set('Este pedido no tiene un saldo disponible para pagar.');
      this.estadoMensajePagoAccion.set('error');
      return;
    }

    this.preparandoPago.set(true);
    this.estadoRetornoPago.set(null);
    this.mensajePagoAccion.set(null);
    this.estadoMensajePagoAccion.set(null);

    this.checkoutApi
      .crearSesionPagoRestante(idPedido)
      .pipe(
        finalize(() => this.preparandoPago.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (resultado) => {
          if (!resultado.urlRedireccion) {
            this.mensajePagoAccion.set(
              'No pudimos abrir el proveedor de pago. Inténtalo nuevamente.',
            );
            this.estadoMensajePagoAccion.set('error');
            return;
          }

          window.location.assign(resultado.urlRedireccion);
        },
        error: (error: unknown) => {
          this.mensajePagoAccion.set(
            obtenerMensajeErrorUsuario(
              error,
              'No pudimos preparar tu pago. Inténtalo nuevamente.',
            ),
          );
          this.estadoMensajePagoAccion.set('error');
        },
      });
  }

  reenviarCodigoEntrega(idPedido: number): void {
    if (!this.puedeReenviarCodigoEntrega() || this.reenviandoCodigoEntrega()) return;

    this.reenviandoCodigoEntrega.set(true);
    this.mensajeCodigoEntrega.set(null);

    this.pedidoClienteApi
      .reenviarCodigoEntrega(idPedido)
      .pipe(
        finalize(() => this.reenviandoCodigoEntrega.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.mensajeCodigoEntrega.set('Te enviamos un nuevo código a tu correo.'),
        error: (error: unknown) =>
          this.mensajeCodigoEntrega.set(
            obtenerMensajeErrorUsuario(error, 'No pudimos enviar un nuevo código. Inténtalo más tarde.'),
          ),
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
