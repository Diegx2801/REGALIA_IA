import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, startWith } from 'rxjs';
import { SesionAutenticacionService } from '../../../core/autenticacion/sesion-autenticacion.service';
import { CarritoCheckoutService } from '../../../core/carrito/carrito-checkout.service';
import { obtenerMensajeErrorUsuario } from '../../../core/http/modelos/error-api.model';
import { Producto } from '../../../domains/catalogo/modelos/producto.model';
import { EstadoPantallaComponent } from '../../../shared/ui/estado-pantalla/estado-pantalla';
import { BuilderIaApiService } from '../acceso-datos/builder-ia-api.service';
import { AccesoBuilderIa } from '../componentes/acceso-builder-ia/acceso-builder-ia';
import { FaseNecesidadIa } from '../componentes/fase-necesidad-ia/fase-necesidad-ia';
import { FaseRecomendacionesIa } from '../componentes/fase-recomendaciones-ia/fase-recomendaciones-ia';
import { FaseReservaIa } from '../componentes/fase-reserva-ia/fase-reserva-ia';
import { HeroBuilderIa } from '../componentes/hero-builder-ia/hero-builder-ia';
import { PasosBuilderIa } from '../componentes/pasos-builder-ia/pasos-builder-ia';
import { PasoBuilderIa, RecomendacionProductoIa } from '../modelos/builder-ia.model';
import { EstadoPantallaComponent } from '../../../shared/ui/estado-pantalla/estado-pantalla';

@Component({
  selector: 'app-pagina-pedir-con-ia',
  imports: [
    FaseNecesidadIa,
    FaseRecomendacionesIa,
    FaseReservaIa,
    HeroBuilderIa,
    PasosBuilderIa,
    EstadoPantallaComponent,
    AccesoBuilderIa,
  ],
  templateUrl: './pagina-pedir-con-ia.html',
  styleUrl: './pagina-pedir-con-ia.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Los estilos builder-* pertenecen a este flujo y se comparten con sus fases internas.
  encapsulation: ViewEncapsulation.None,
})
export class PaginaPedirConIa {
  private readonly builderIaApi = inject(BuilderIaApiService);
  private readonly carritoCheckout = inject(CarritoCheckoutService);
  private readonly sesion = inject(SesionAutenticacionService);
  private readonly router = inject(Router);
  private readonly documento = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  readonly formulario = new FormGroup({
    necesidad: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(800)],
    }),
  });

  private readonly valorNecesidad = toSignal(
    this.formulario.controls.necesidad.valueChanges.pipe(
      startWith(this.formulario.controls.necesidad.value),
    ),
    { initialValue: this.formulario.controls.necesidad.value },
  );

  readonly pasoActual = signal(1);
  readonly cargandoRecomendaciones = signal(false);
  readonly mensajeError = signal<string | null>(null);
  readonly mensajeExito = signal<string | null>(null);
  readonly respuestaIa = signal<string | null>(null);
  readonly productosRecomendados = signal<RecomendacionProductoIa[]>([]);
  readonly productoSeleccionado = signal<Producto | null>(null);
  readonly productoAgregado = signal(false);
  readonly puedeUsarIa = computed(
    () =>
      this.sesion.estaAutenticado() &&
      this.sesion.tieneRol(['CLIENTE', 'VENDEDOR']),
  );

  readonly pasos: readonly PasoBuilderIa[] = [
    { numero: 1, titulo: 'Tu idea', descripcion: 'Describe el regalo' },
    { numero: 2, titulo: 'Recomendaciones', descripcion: 'Compara productos reales' },
    { numero: 3, titulo: 'Confirmación', descripcion: 'Agrégalo al carrito' },
  ];

  readonly descripcionActual = computed(() => {
    const valor = this.valorNecesidad().trim();
    return valor || 'Describe qué regalo necesitas para que REGALIA pueda ayudarte.';
  });

  irAPaso(numeroPaso: number): void {
    if (numeroPaso > this.pasoActual() || numeroPaso < 1) return;
    this.limpiarMensajes();
    this.pasoActual.set(numeroPaso);
  }

  continuar(): void {
    this.limpiarMensajes();

    if (this.pasoActual() === 1) {
      this.solicitarRecomendaciones();
      return;
    }

    if (this.pasoActual() === 2 && !this.productoSeleccionado()) {
      this.mensajeError.set('Selecciona una recomendación disponible antes de continuar.');
      return;
    }

    this.pasoActual.update((paso) => Math.min(paso + 1, 3));
  }

  volver(): void {
    this.limpiarMensajes();
    this.pasoActual.update((paso) => Math.max(paso - 1, 1));
  }

  ajustarSolicitud(): void {
    this.limpiarMensajes();
    this.pasoActual.set(1);
    queueMicrotask(() => this.documento.getElementById('need')?.focus());
  }

  reintentar(): void {
    this.limpiarMensajes();
    this.solicitarRecomendaciones();
  }

  seleccionarProducto(producto: Producto): void {
    if (!producto.disponible || producto.stock <= 0) return;
    this.productoSeleccionado.set(producto);
    this.productoAgregado.set(false);
    this.limpiarMensajes();
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
    if (this.productoAgregado()) return;

    this.carritoCheckout.agregarProducto(producto);
    this.productoAgregado.set(true);
    this.mensajeExito.set('Producto agregado al carrito. Puedes seguir con el checkout real.');
  }

  irAlCarrito(): void {
    void this.router.navigateByUrl('/carrito');
  }

  private solicitarRecomendaciones(): void {
    if (this.cargandoRecomendaciones()) return;

    if (!this.puedeUsarIa()) return;

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      queueMicrotask(() => this.documento.getElementById('need')?.focus());
      return;
    }

    this.cargandoRecomendaciones.set(true);
    this.respuestaIa.set(null);
    this.productosRecomendados.set([]);
    this.productoSeleccionado.set(null);
    this.productoAgregado.set(false);

    this.builderIaApi
      .recomendarProductos({ busqueda: this.formulario.controls.necesidad.value })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.cargandoRecomendaciones.set(false)),
      )
      .subscribe({
        next: (resultado) => {
          this.respuestaIa.set(resultado.respuesta);
          this.productosRecomendados.set(resultado.productosRecomendados);
          this.pasoActual.set(2);
        },
        error: (error: unknown) => this.mensajeError.set(this.obtenerMensajeErrorIa(error)),
      });
  }

  private limpiarMensajes(): void {
    this.mensajeError.set(null);
    this.mensajeExito.set(null);
  }

  private obtenerMensajeErrorIa(error: unknown): string {
    return obtenerMensajeErrorUsuario(
      error,
      'No pudimos generar recomendaciones. Revisa tu conexión e inténtalo nuevamente.',
    );
  }
}
