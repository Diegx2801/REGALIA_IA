import { CurrencyPipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CarritoCheckoutService } from '../../../../core/carrito/carrito-checkout.service';
import { BotonDirective } from '../../../../shared/directivas/boton.directive';
import {
  CampoFormularioDirective,
  ErrorCampoDirective,
} from '../../../../shared/directivas/formulario-panel.directive';

@Component({
  selector: 'app-pagina-carrito',
  imports: [CurrencyPipe, FormsModule, RouterLink, BotonDirective, CampoFormularioDirective, ErrorCampoDirective],
  templateUrl: './pagina-carrito.html',
  styleUrl: './pagina-carrito.css',
})
export class PaginaCarrito implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly carrito = inject(CarritoCheckoutService);

  readonly estadoPago = signal<string | null>(null);
  readonly vieneDeCheckout = signal(false);
  readonly itemsSinPersonalizacion = computed(() =>
    this.carrito.items().filter((item) => !item.observacion?.trim()),
  );
  readonly puedePrepararCheckout = computed(
    () => !this.carrito.estaVacio() && this.itemsSinPersonalizacion().length === 0,
  );

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((parametros) => {
      const vieneDeCheckout = parametros.get('checkout') === 'confirmacion';
      const estadoPago = parametros.get('payment');

      this.vieneDeCheckout.set(vieneDeCheckout);
      this.estadoPago.set(estadoPago);

      // Si la pasarela confirma exito, el carrito local ya cumplio su trabajo y se limpia.
      if (vieneDeCheckout && estadoPago === 'success') {
        this.carrito.limpiarCarrito();
      }
    });
  }

  actualizarCantidad(idProducto: number, cantidad: number): void {
    this.carrito.actualizarCantidad(idProducto, Number(cantidad));
  }

  actualizarObservacion(idProducto: number, observacion: string): void {
    this.carrito.actualizarObservacion(idProducto, observacion);
  }

  prepararCheckout(): void {
    if (!this.puedePrepararCheckout()) return;
    void this.router.navigateByUrl('/checkout/carrito');
  }
}
