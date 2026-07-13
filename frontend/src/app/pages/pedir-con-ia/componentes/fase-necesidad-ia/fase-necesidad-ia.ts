import { Component, computed, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CampoTextarea } from '../../../../shared/ui/formularios/campo-textarea/campo-textarea';

@Component({
  selector: 'app-fase-necesidad-ia',
  imports: [CampoTextarea, ReactiveFormsModule],
  templateUrl: './fase-necesidad-ia.html',
})
export class FaseNecesidadIa {
  readonly formulario = input.required<FormGroup>();
  readonly descripcionActual = input.required<string>();
  readonly cargando = input.required<boolean>();
  readonly continuar = output<void>();

  readonly controlNecesidad = computed(
    () => this.formulario().get('necesidad') as FormControl<string>,
  );
}
