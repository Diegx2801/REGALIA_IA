import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-fase-interpretacion-ia',
  templateUrl: './fase-interpretacion-ia.html',
})
export class FaseInterpretacionIa {
  readonly respuestaIa = input.required<string | null>();
  readonly descripcionActual = input.required<string>();
  readonly volver = output<void>();
  readonly continuar = output<void>();
}
