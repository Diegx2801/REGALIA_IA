import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CartService } from '../../../core/services/cart/cart.service';
import {
  FaseBuilder,
  PasoConstructor,
  RecomendacionProductoConstructor,
  SolicitudBuilderIAConstructor,
  SugerenciaRapidaConstructor,
  VistaPreviaSolicitudConstructor,
} from './models/builder.model';
import { BuilderFlowService } from './services/builder-flow.service';

@Component({
  // PATRON DECORATOR: @Component registra este builder como componente usable dentro de Angular.
  selector: 'app-builder',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './builder.html',
  styleUrl: './builder.css',
})

export class BuilderComponent {
  readonly limiteBusqueda = 200;

  private readonly flujoBuilder = inject(BuilderFlowService);
  private readonly carrito = inject(CartService);
  private readonly necesidadInicial = 'Necesito una torta elegante para graduación.';

  @ViewChild('resultsRegion') private readonly resultsRegion?: ElementRef<HTMLElement>;

  // Estado principal del flujo de cuatro pasos del constructor IA.
  readonly faseActual = signal<FaseBuilder>('necesidad');
  readonly recomendaciones = signal<RecomendacionProductoConstructor[]>([]);
  readonly recomendacionSeleccionada = signal<RecomendacionProductoConstructor | null>(null);
  readonly recomendacionConfirmada = signal<RecomendacionProductoConstructor | null>(null);
  readonly mensajeBusqueda = signal<string | null>(null);
  readonly longitudNecesidad = signal(this.necesidadInicial.length);
  readonly cargandoRecomendaciones = signal(false);

  readonly pasos: PasoConstructor[] = [
    {
      fase: 'necesidad',
      etiqueta: 'Necesidad',
      descripcion: 'Cuéntanos qué buscas',
    },
    {
      fase: 'interpretacion',
      etiqueta: 'Interpretación IA',
      descripcion: 'Entendemos tu solicitud',
    },
    {
      fase: 'recomendaciones',
      etiqueta: 'Recomendaciones',
      descripcion: 'Productos ideales para ti',
    },
    {
      fase: 'reserva',
      etiqueta: 'Reserva',
      descripcion: 'Confirmas y coordinamos',
    },
  ];

  readonly sugerenciasRapidas: SugerenciaRapidaConstructor[] = [
    {
      etiqueta: 'Cumpleaños',
      urlImagen: '/images/cumpleanios1.PNG',
      necesidad: 'Busco un regalo especial para cumpleaños, personalizado y bonito.',
    },
    {
      etiqueta: 'Aniversario',
      urlImagen: '/images/aniversario.PNG',
      necesidad: 'Quiero un regalo romántico para aniversario, elegante y con algún detalle personalizado.',
    },
    {
      etiqueta: 'Graduación',
      urlImagen: '/images/graduacion.PNG',
      necesidad: 'Necesito una torta elegante para graduación.',
    },
    {
      etiqueta: 'Flores',
      urlImagen: '/images/flores.PNG',
      necesidad: 'Busco flores bonitas para una sorpresa, con presentación elegante y entrega coordinada.',
    },
    {
      etiqueta: 'Box personalizado',
      urlImagen: '/images/boxpersonalizado.PNG',
      necesidad: 'Quiero un box personalizado con detalles dulces, tarjeta y presentación premium.',
    },
    {
      etiqueta: 'Torta',
      urlImagen: '/images/torta2.PNG',
      necesidad: 'Necesito una torta personalizada, bonita y con entrega para una celebración especial.',
    },
  ];

  // Formulario mínimo del builder IA; el backend solo necesita una búsqueda en lenguaje natural.
  // FORMULARIOS WEB: el builder valida la necesidad del cliente antes de consultar recomendaciones.
  readonly formularioSolicitud = new FormGroup({
    necesidad: new FormControl(
      this.necesidadInicial,
      {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.minLength(12),
          Validators.maxLength(this.limiteBusqueda),
        ],
      },
    ),
  });

  // Muestra el resumen interpretado de la recomendación seleccionada.
  readonly resumenInterpretado = computed(
    () => this.recomendacionSeleccionada()?.interpretacion ?? null,
  );

  // Mantiene una vista previa reactiva sin esperar a enviar la solicitud.
  readonly vistaPreviaSolicitud = computed<VistaPreviaSolicitudConstructor>(() => {
    const valorFormulario = this.formularioSolicitud.getRawValue();

    return {
      descripcion: valorFormulario.necesidad.trim(),
    };
  });

  readonly datosVendedorSeleccionado = computed(() => {
    const seleccionada = this.recomendacionSeleccionada();

    if (!seleccionada) {
      return [];
    }

    const vendedor = seleccionada.vendedor;

    return [
      seleccionada.producto.deliveryTime,
      seleccionada.producto.stockStatus,
      vendedor
        ? `* ${vendedor.rating} · ${vendedor.reviews} reseñas`
        : `* ${seleccionada.producto.rating} · ${seleccionada.producto.reviews} reseñas`,
    ];
  });

  aplicarSugerencia(sugerencia: SugerenciaRapidaConstructor): void {
    this.formularioSolicitud.patchValue({
      necesidad: sugerencia.necesidad,
    });
    this.actualizarLongitudNecesidad();

    this.mensajeBusqueda.set(null);
    this.recomendaciones.set([]);
    this.recomendacionSeleccionada.set(null);
    this.recomendacionConfirmada.set(null);
    this.faseActual.set('necesidad');
  }

  continuarAInterpretacion(): void {
    if (!this.validarFormularioSolicitud()) {
      return;
    }

    this.generarRecomendaciones(false);
    this.faseActual.set('interpretacion');
  }

  continuarARecomendaciones(): void {
    if (this.cargandoRecomendaciones()) {
      this.faseActual.set('recomendaciones');
      this.enfocarResultados();
      return;
    }

    if (this.recomendaciones().length === 0) {
      this.generarRecomendaciones(false);
    }

    this.faseActual.set('recomendaciones');
    this.enfocarResultados();
  }

  continuarAReserva(): void {
    if (!this.recomendacionSeleccionada()) {
      this.mensajeBusqueda.set('Selecciona una recomendación antes de preparar la reserva.');
      this.faseActual.set('recomendaciones');
      return;
    }

    this.faseActual.set('reserva');
  }

  irAFase(fase: FaseBuilder): void {
    if (!this.puedeAbrirFase(fase)) {
      return;
    }

    this.faseActual.set(fase);
  }

  estaPasoActivo(fase: FaseBuilder): boolean {
    return this.faseActual() === fase;
  }

  estaPasoCompletado(fase: FaseBuilder): boolean {
    return this.indiceFase(fase) < this.indiceFase(this.faseActual());
  }

  puedeAbrirFase(fase: FaseBuilder): boolean {
    if (this.cargandoRecomendaciones()) {
      return fase === 'necesidad';
    }

    if (fase === 'necesidad') {
      return true;
    }

    if (fase === 'interpretacion') {
      return this.recomendaciones().length > 0;
    }

    if (fase === 'recomendaciones') {
      return this.recomendaciones().length > 0;
    }

    return this.recomendacionSeleccionada() !== null;
  }

  textoIndiceFase(fase: FaseBuilder): number {
    return this.indiceFase(fase) + 1;
  }

  /**
   * Valida la solicitud y delega la generación de recomendaciones al servicio del flujo.
   */
  generarRecomendaciones(debeEnfocarResultados = true): void {
    if (!this.validarFormularioSolicitud() || this.cargandoRecomendaciones()) {
      return;
    }

    this.cargandoRecomendaciones.set(true);
    this.mensajeBusqueda.set('Buscando recomendaciones con IA...');
    this.recomendaciones.set([]);
    this.recomendacionSeleccionada.set(null);
    this.recomendacionConfirmada.set(null);

    this.flujoBuilder.obtenerRecomendaciones(this.obtenerSolicitudBuilderIA()).subscribe({
      next: (resultado) => {
        const coincidencias = resultado.recomendaciones;

        this.recomendaciones.set(coincidencias);
        this.recomendacionSeleccionada.set(coincidencias[0] ?? null);
        this.recomendacionConfirmada.set(null);
        this.mensajeBusqueda.set(resultado.mensaje);

        if (debeEnfocarResultados) {
          this.enfocarResultados();
        }
      },
      error: () => {
        this.recomendaciones.set([]);
        this.recomendacionSeleccionada.set(null);
        this.recomendacionConfirmada.set(null);
        this.mensajeBusqueda.set('No se encontraron recomendaciones para esta búsqueda.');
        this.cargandoRecomendaciones.set(false);
      },
      complete: () => {
        this.cargandoRecomendaciones.set(false);
      },
    });
  }

  seleccionarRecomendacion(recomendacion: RecomendacionProductoConstructor): void {
    this.recomendacionSeleccionada.set(recomendacion);
    this.recomendacionConfirmada.set(null);
  }

  prepararReserva(): void {
    const seleccionada = this.recomendacionSeleccionada();

    if (!seleccionada) {
      return;
    }

    this.recomendacionConfirmada.set(seleccionada);
    this.faseActual.set('reserva');
  }

  agregarAlCarrito(): void {
    const seleccionada = this.recomendacionSeleccionada();

    if (!seleccionada) {
      this.mensajeBusqueda.set('Selecciona una recomendación antes de agregarla al carrito.');
      this.faseActual.set('recomendaciones');
      return;
    }

    this.carrito.addProduct(seleccionada.producto);
    this.recomendacionConfirmada.set(seleccionada);
  }

  limpiarReservaPreparada(): void {
    this.recomendacionConfirmada.set(null);
    this.faseActual.set('recomendaciones');
  }

  reiniciarFlujo(): void {
    this.faseActual.set('necesidad');
    this.recomendaciones.set([]);
    this.recomendacionSeleccionada.set(null);
    this.recomendacionConfirmada.set(null);
    this.mensajeBusqueda.set(null);
  }

  rastrearPaso(_: number, paso: PasoConstructor): FaseBuilder {
    return paso.fase;
  }

  rastrearRecomendacion(_: number, recomendacion: RecomendacionProductoConstructor): number {
    return recomendacion.producto.id;
  }

  rastrearTexto(_: number, valor: string): string {
    return valor;
  }

  rastrearSugerencia(_: number, sugerencia: SugerenciaRapidaConstructor): string {
    return sugerencia.etiqueta;
  }

  actualizarLongitudNecesidad(): void {
    this.longitudNecesidad.set(this.formularioSolicitud.controls.necesidad.value.length);
  }

  private validarFormularioSolicitud(): boolean {
    if (this.formularioSolicitud.valid) {
      this.mensajeBusqueda.set(null);
      return true;
    }

    this.formularioSolicitud.markAllAsTouched();
    this.mensajeBusqueda.set('Completa los datos requeridos para continuar.');
    return false;
  }

  private obtenerSolicitudBuilderIA(): SolicitudBuilderIAConstructor {
    const valorFormulario = this.formularioSolicitud.getRawValue();

    return {
      busqueda: valorFormulario.necesidad.trim(),
    };
  }

  private enfocarResultados(): void {
    window.setTimeout(() => {
      this.resultsRegion?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  private indiceFase(fase: FaseBuilder): number {
    return this.pasos.findIndex((paso) => paso.fase === fase);
  }
}
