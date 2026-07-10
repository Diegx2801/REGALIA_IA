import { Component, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'form[app-filtros-panel]',
  templateUrl: './filtros-panel.html',
  styleUrl: './filtros-panel.css',
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'rg-filtros-panel',
  },
})
export class FiltrosPanelComponent {}
