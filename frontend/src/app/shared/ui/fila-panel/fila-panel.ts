import { Component, input } from '@angular/core';

export type TipoFilaPanel = 'doble' | 'triple' | 'tres-columnas' | 'producto' | 'apilada';

@Component({
  selector: 'app-fila-panel',
  templateUrl: './fila-panel.html',
  styleUrl: './fila-panel.css',
})
export class FilaPanelComponent {
  readonly tipo = input<TipoFilaPanel>('doble');
  readonly ariaEtiqueta = input<string | null>(null);
}
