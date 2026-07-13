import { Component, computed, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-campo-textarea',
  imports: [ReactiveFormsModule],
  templateUrl: './campo-textarea.html',
  styleUrl: '../formulario-compartido.css',
})
export class CampoTextarea {
  readonly id = input.required<string>();
  readonly etiqueta = input.required<string>();
  readonly control = input.required<FormControl<string>>();
  readonly placeholder = input('');
  readonly filas = input(4);
  readonly maximoCaracteres = input<number | null>(null);
  readonly ayuda = input<string | null>(null);
  readonly mensajeError = input('Revisa este campo.');

  readonly debeMostrarError = computed(() => {
    const control = this.control();
    return control.invalid && (control.touched || control.dirty);
  });

  readonly caracteresUsados = computed(() => this.control().value.length);
  readonly idAyuda = computed(() => `${this.id()}-ayuda`);
  readonly idError = computed(() => `${this.id()}-error`);
  readonly idContador = computed(() => `${this.id()}-contador`);
  readonly ariaDescribedBy = computed(() => {
    const referencias = [
      this.ayuda() ? this.idAyuda() : null,
      this.maximoCaracteres() ? this.idContador() : null,
      this.debeMostrarError() ? this.idError() : null,
    ];

    return referencias.filter(Boolean).join(' ') || null;
  });
}
