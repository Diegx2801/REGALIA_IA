import { Component, computed, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

export interface OpcionCampoSelect {
  readonly valor: string;
  readonly etiqueta: string;
}

@Component({
  selector: 'app-campo-select',
  imports: [ReactiveFormsModule],
  templateUrl: './campo-select.html',
  styleUrl: '../formulario-compartido.css',
})
export class CampoSelect {
  readonly id = input.required<string>();
  readonly etiqueta = input.required<string>();
  readonly control = input.required<FormControl<string>>();
  readonly opciones = input.required<readonly OpcionCampoSelect[]>();
  readonly mensajeError = input('Selecciona una opcion valida.');

  readonly debeMostrarError = computed(() => {
    const control = this.control();
    return control.invalid && (control.touched || control.dirty);
  });

  readonly idError = computed(() => `${this.id()}-error`);
  readonly ariaDescribedBy = computed(() => (this.debeMostrarError() ? this.idError() : null));
}
