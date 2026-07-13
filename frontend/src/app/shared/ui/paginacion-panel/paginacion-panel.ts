import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-paginacion-panel',
  templateUrl: './paginacion-panel.html',
  styleUrl: './paginacion-panel.css',
})
export class PaginacionPanelComponent {
  readonly paginaActual = input.required<number>();
  readonly totalPaginas = input.required<number>();
  readonly ariaEtiqueta = input('Paginacion del listado');

  readonly anterior = output<void>();
  readonly siguiente = output<void>();

  irPaginaAnterior(): void {
    // La pagina contenedora mantiene la regla real de consulta y recarga contra backend.
    this.anterior.emit();
  }

  irPaginaSiguiente(): void {
    this.siguiente.emit();
  }
}
