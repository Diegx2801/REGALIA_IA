import { Component, input, output } from '@angular/core';

export type EmptyStateTone = 'neutral' | 'success' | 'warning' | 'error';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.css',
})
export class EmptyStateComponent {
  readonly icon = input('R');
  readonly title = input.required<string>();
  readonly text = input('');
  readonly actionLabel = input('');
  readonly tone = input<EmptyStateTone>('neutral');
  readonly actionClick = output<void>();

  onActionClick(): void {
    this.actionClick.emit();
  }
}
