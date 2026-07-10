import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

interface PasoBuilder {
  readonly numero: number;
  readonly titulo: string;
  readonly descripcion: string;
}

interface SugerenciaRapida {
  readonly etiqueta: string;
  readonly imagen: string;
  readonly texto: string;
}

interface RecomendacionRegalo {
  readonly titulo: string;
  readonly vendedor: string;
  readonly descripcion: string;
  readonly precio: string;
  readonly compatibilidad: string;
  readonly etiquetas: readonly string[];
}

@Component({
  selector: 'app-pagina-pedir-con-ia',
  imports: [ReactiveFormsModule],
  templateUrl: './pagina-pedir-con-ia.html',
  styleUrl: './pagina-pedir-con-ia.css',
})
export class PaginaPedirConIa {
  private readonly router = inject(Router);

  readonly pasoActual = signal(1);
  readonly solicitudConfirmada = signal(false);

  readonly formulario = new FormGroup({
    necesidad: new FormControl('Necesito una torta elegante para graduacion.', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(200)],
    }),
  });

  readonly pasos: readonly PasoBuilder[] = [
    { numero: 1, titulo: 'Necesidad', descripcion: 'Cuentanos que buscas' },
    { numero: 2, titulo: 'Interpretacion IA', descripcion: 'Entendemos tu solicitud' },
    { numero: 3, titulo: 'Recomendaciones', descripcion: 'Productos ideales para ti' },
    { numero: 4, titulo: 'Reserva', descripcion: 'Confirmas y coordinamos' },
  ];

  readonly sugerencias: readonly SugerenciaRapida[] = [
    {
      etiqueta: 'Cumpleanos',
      imagen: '/assets/brand/iconos/cumpleanos-1.png',
      texto: 'Quiero un regalo personalizado para cumpleanos con flores, torta y entrega en mi distrito.',
    },
    {
      etiqueta: 'Aniversario',
      imagen: '/assets/brand/iconos/aniversario.png',
      texto: 'Busco un detalle romantico para aniversario, elegante, personalizado y con presentacion premium.',
    },
    {
      etiqueta: 'Graduacion',
      imagen: '/assets/brand/iconos/graduacion.png',
      texto: 'Necesito una torta elegante para graduacion con flores y mensaje personalizado.',
    },
    {
      etiqueta: 'Flores',
      imagen: '/assets/brand/iconos/flores.png',
      texto: 'Quiero un arreglo floral delicado, con tarjeta personalizada y entrega segura.',
    },
    {
      etiqueta: 'Box personalizado',
      imagen: '/assets/brand/iconos/box-personalizado.png',
      texto: 'Busco un box personalizado con dulces, flores, carta y estilo premium.',
    },
    {
      etiqueta: 'Torta',
      imagen: '/assets/brand/iconos/torta-2.png',
      texto: 'Necesito una torta personalizada con decoracion elegante y entrega puntual.',
    },
  ];

  readonly recomendaciones: readonly RecomendacionRegalo[] = [
    {
      titulo: 'Box celebracion premium',
      vendedor: 'Dulce Detalle',
      descripcion: 'Torta mini, flores y tarjeta personalizada para entrega coordinada.',
      precio: 'S/ 129',
      compatibilidad: '96%',
      etiquetas: ['Premium', 'Entrega local', 'Personalizable'],
    },
    {
      titulo: 'Arreglo floral con detalle dulce',
      vendedor: 'Floralia Studio',
      descripcion: 'Ramo curado, chocolates artesanales y empaque elegante.',
      precio: 'S/ 99',
      compatibilidad: '92%',
      etiquetas: ['Flores', 'Verificado', 'Reserva con sena'],
    },
    {
      titulo: 'Torta tematica personalizada',
      vendedor: 'Momentos Deco',
      descripcion: 'Torta a medida con mensaje, color y decoracion segun ocasion.',
      precio: 'S/ 115',
      compatibilidad: '89%',
      etiquetas: ['Torta', 'Graduacion', 'Hecho a pedido'],
    },
  ];

  readonly caracteresUsados = computed(() => this.formulario.controls.necesidad.value.length);
  readonly descripcionActual = computed(() => {
    const valor = this.formulario.controls.necesidad.value.trim();
    return valor || 'Describe que regalo necesitas para que REGALIA pueda ayudarte.';
  });
  readonly pasoActivo = computed(() => this.pasos.find((paso) => paso.numero === this.pasoActual()));

  aplicarSugerencia(sugerencia: SugerenciaRapida): void {
    this.formulario.controls.necesidad.setValue(sugerencia.texto);
    this.formulario.controls.necesidad.markAsDirty();
  }

  irAPaso(numeroPaso: number): void {
    if (numeroPaso > this.pasoActual()) return;
    this.pasoActual.set(numeroPaso);
  }

  continuar(): void {
    if (this.pasoActual() === 1 && this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.pasoActual.update((paso) => Math.min(paso + 1, 4));
  }

  volver(): void {
    this.solicitudConfirmada.set(false);
    this.pasoActual.update((paso) => Math.max(paso - 1, 1));
  }

  buscarEnCatalogo(): void {
    void this.router.navigate(['/catalogo'], {
      queryParams: { busqueda: this.descripcionActual() },
    });
  }

  confirmarSolicitud(): void {
    // Flujo frontend: la confirmacion real se conectara al backend cuando exista el endpoint IA.
    this.solicitudConfirmada.set(true);
  }
}
