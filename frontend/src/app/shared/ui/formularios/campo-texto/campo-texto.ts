import { Component, computed, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

export type TipoCampoTexto = 'text' | 'email' | 'password' | 'search' | 'tel' | 'date' | 'number';

@Component({
  selector: 'app-campo-texto',
  imports: [ReactiveFormsModule],
  templateUrl: './campo-texto.html',
  styleUrl: '../formulario-compartido.css',
})
export class CampoTexto {
  readonly id = input.required<string>();
  readonly etiqueta = input.required<string>();
  readonly control = input.required<FormControl<string>>();
  readonly tipo = input<TipoCampoTexto>('text');
  readonly placeholder = input('');
  readonly autocomplete = input<string | null>(null);
  readonly ayuda = input<string | null>(null);
  readonly mensajeError = input('Revisa este campo.');

  readonly debeMostrarError = computed(() => {
    const control = this.control();
    return control.invalid && (control.touched || control.dirty);
  });

  readonly idAyuda = computed(() => `${this.id()}-ayuda`);
  readonly idError = computed(() => `${this.id()}-error`);
  readonly ariaDescribedBy = computed(() => {
    const referencias = [this.ayuda() ? this.idAyuda() : null, this.debeMostrarError() ? this.idError() : null];
    return referencias.filter(Boolean).join(' ') || null;
  });
}
