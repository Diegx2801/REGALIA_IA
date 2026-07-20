import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-grupo-metricas-panel',
  templateUrl: './grupo-metricas-panel.html',
  styleUrl: './grupo-metricas-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GrupoMetricasPanelComponent {
  readonly ariaEtiqueta = input<string | null>(null);
  readonly columnasMovil = input<1 | 2>(1);
}
