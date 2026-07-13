import { Component, input } from '@angular/core';

@Component({
  selector: 'app-grupo-metricas-panel',
  templateUrl: './grupo-metricas-panel.html',
  styleUrl: './grupo-metricas-panel.css',
})
export class GrupoMetricasPanelComponent {
  readonly ariaEtiqueta = input<string | null>(null);
}
