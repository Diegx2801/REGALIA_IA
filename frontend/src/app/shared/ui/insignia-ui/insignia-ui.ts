import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type VarianteInsignia = 'neutral' | 'primaria' | 'exito' | 'advertencia' | 'error';

@Component({
  selector: 'app-insignia-ui',
  templateUrl: './insignia-ui.html',
  styleUrl: './insignia-ui.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InsigniaUi {
  readonly texto = input.required<string>();
  readonly variante = input<VarianteInsignia>('neutral');
}
