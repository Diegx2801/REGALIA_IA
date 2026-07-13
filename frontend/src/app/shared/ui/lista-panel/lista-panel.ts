import { Component, input } from '@angular/core';

@Component({
  selector: 'app-lista-panel',
  templateUrl: './lista-panel.html',
  styleUrl: './lista-panel.css',
})
export class ListaPanelComponent {
  readonly ariaEtiqueta = input<string | null>(null);
}
