import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { PasoBuilderIa } from '../../modelos/builder-ia.model';

@Component({
  selector: 'app-pasos-builder-ia',
  templateUrl: './pasos-builder-ia.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasosBuilderIa {
  readonly pasos = input.required<readonly PasoBuilderIa[]>();
  readonly pasoActual = input.required<number>();
  readonly irAPaso = output<number>();
}
