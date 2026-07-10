import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { CarritoCheckoutService } from '../../../core/carrito/carrito-checkout.service';
import { Producto } from '../../../domains/catalogo/modelos/producto.model';
import { BuilderIaApiService } from '../acceso-datos/builder-ia-api.service';

interface PasoBuilder {
  readonly numero: number;
  readonly titulo: string;
  readonly descripcion: string;
}

@Component({
  selector: 'app-pagina-pedir-con-ia',
  imports: [CurrencyPipe, ReactiveFormsModule],
  templateUrl: './pagina-pedir-con-ia.html',
  styleUrl: './pagina-pedir-con-ia.css',
})
export class PaginaPedirConIa {
  private readonly builderIaApi = inject(BuilderIaApiService);
  private readonly carritoCheckout = inject(CarritoCheckoutService);
  private readonly router = inject(Router);

  readonly pasoActual = signal(1);
  readonly cargandoRecomendaciones = signal(false);
  readonly mensajeError = signal<string | null>(null);
  readonly mensajeExito = signal<string | null>(null);
  readonly respuestaIa = signal<string | null>(null);
  readonly productosRecomendados = signal<Producto[]>([]);
  readonly productoSeleccionado = signal<Producto | null>(null);

  readonly formulario = new FormGroup({
    necesidad: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(800)],
    }),
  });

  readonly pasos: readonly PasoBuilder[] = [
    { numero: 1, titulo: 'Necesidad', descripcion: 'Cuentanos que buscas' },
    { numero: 2, titulo: 'Interpretacion IA', descripcion: 'Respuesta del backend' },
    { numero: 3, titulo: 'Recomendaciones', descripcion: 'Productos reales' },
    { numero: 4, titulo: 'Reserva', descripcion: 'Confirmas tu eleccion' },
  ];

  readonly caracteresUsados = computed(() => this.formulario.controls.necesidad.value.length);
  readonly descripcionActual = computed(() => {
    const valor = this.formulario.controls.necesidad.value.trim();
    return valor || 'Describe que regalo necesitas para que REGALIA pueda ayudarte.';
  });
  readonly pasoActivo = computed(() => this.pasos.find((paso) => paso.numero === this.pasoActual()));

  irAPaso(numeroPaso: number): void {
    if (numeroPaso > this.pasoActual()) return;
    this.pasoActual.set(numeroPaso);
  }

  continuar(): void {
    this.mensajeError.set(null);
    this.mensajeExito.set(null);

    if (this.pasoActual() === 1) {
      this.solicitarRecomendaciones();
      return;
    }

    if (this.pasoActual() === 3 && !this.productoSeleccionado()) {
      this.mensajeError.set('Selecciona un producto recomendado antes de preparar la reserva.');
      return;
    }

    this.pasoActual.update((paso) => Math.min(paso + 1, 4));
  }

  volver(): void {
    this.mensajeError.set(null);
    this.mensajeExito.set(null);
    this.pasoActual.update((paso) => Math.max(paso - 1, 1));
  }

  seleccionarProducto(producto: Producto): void {
    if (!producto.disponible) return;
    this.productoSeleccionado.set(producto);
    this.mensajeError.set(null);
  }

  buscarEnCatalogo(): void {
    void this.router.navigate(['/catalogo'], {
      queryParams: { busqueda: this.descripcionActual() },
    });
  }

  confirmarSolicitud(): void {
    const producto = this.productoSeleccionado();
    if (!producto) {
      this.mensajeError.set('Selecciona un producto real antes de continuar.');
      return;
    }

    this.carritoCheckout.agregarProducto(producto);
    this.mensajeExito.set('Producto agregado al carrito. Puedes continuar con el checkout real.');
  }

  irAlCarrito(): void {
    void this.router.navigateByUrl('/carrito');
  }

  identificarProducto(_indice: number, producto: Producto): number {
    return producto.idProducto;
  }

  private solicitarRecomendaciones(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.cargandoRecomendaciones.set(true);
    this.respuestaIa.set(null);
    this.productosRecomendados.set([]);
    this.productoSeleccionado.set(null);

    this.builderIaApi
      .recomendarProductos({ busqueda: this.formulario.controls.necesidad.value })
      .pipe(finalize(() => this.cargandoRecomendaciones.set(false)))
      .subscribe({
        next: (resultado) => {
          this.respuestaIa.set(resultado.respuesta);
          this.productosRecomendados.set(resultado.productosRecomendados);
          this.pasoActual.set(2);
        },
        error: (error: unknown) => this.mensajeError.set(this.obtenerMensajeErrorIa(error)),
      });
  }

  private obtenerMensajeErrorIa(error: unknown): string {
    const mensaje = error instanceof Error ? error.message : '';

    if (mensaje.includes('Http failure response') || mensaje.includes('Unknown Error')) {
      return 'No pudimos conectar con el servicio IA del backend.';
    }

    return mensaje || 'No se pudo generar recomendaciones.';
  }
}
