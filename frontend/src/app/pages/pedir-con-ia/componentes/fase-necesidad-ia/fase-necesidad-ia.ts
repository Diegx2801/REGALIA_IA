import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CampoTextarea } from '../../../../shared/ui/formularios/campo-textarea/campo-textarea';

@Component({
  selector: 'app-fase-necesidad-ia',
  imports: [CampoTextarea, ReactiveFormsModule],
  templateUrl: './fase-necesidad-ia.html',
  styleUrl: './fase-necesidad-ia.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaseNecesidadIa {
  readonly formulario = input.required<FormGroup<{ necesidad: FormControl<string> }>>();
  readonly descripcionActual = input.required<string>();
  readonly cargando = input.required<boolean>();
  readonly continuar = output<void>();

  readonly ejemplos = [
    'Un detalle elegante para una graduación, hasta S/ 120',
    'Un regalo romántico con flores y chocolates',
    'Una sorpresa de cumpleaños personalizada para mi mamá',
  ] as const;

  readonly controlNecesidad = computed(() => this.formulario().controls.necesidad);

  aplicarEjemplo(ejemplo: string): void {
    this.controlNecesidad().setValue(ejemplo);
    this.controlNecesidad().markAsDirty();
  }
}
