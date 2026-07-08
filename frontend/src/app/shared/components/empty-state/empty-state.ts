import { Component, input, output } from '@angular/core';

export type EmptyStateTone = 'neutral' | 'success' | 'warning' | 'error';

@Component({
  // COMPONENTE ANGULAR: este componente reutilizable encapsula una vista vacia con una sola responsabilidad.
  selector: 'app-empty-state',
  standalone: true,
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.css',
})
export class EmptyStateComponent {
  // INPUT: input() recibe datos del componente padre sin acoplar la logica interna.
  readonly icon = input('R');
  readonly title = input.required<string>();
  readonly text = input('');
  readonly actionLabel = input('');
  readonly tone = input<EmptyStateTone>('neutral');
  // OUTPUT: output() emite eventos al padre cuando el usuario interactua con este componente.
  readonly actionClick = output<void>();

  onActionClick(): void {
    this.actionClick.emit();
  }
}
