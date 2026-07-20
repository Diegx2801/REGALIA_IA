import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';

export type TamanoDialogoUi = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-dialogo-ui',
  templateUrl: './dialogo-ui.html',
  styleUrl: './dialogo-ui.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogoUi {
  private readonly documento = inject(DOCUMENT);
  private readonly dialogo = viewChild<ElementRef<HTMLDialogElement>>('dialogo');
  private elementoActivador: HTMLElement | null = null;

  readonly abierto = input.required<boolean>();
  readonly idDialogo = input<string | null>(null);
  readonly idTitulo = input.required<string>();
  readonly idDescripcion = input<string | null>(null);
  readonly tamano = input<TamanoDialogoUi>('md');
  readonly solicitudCierre = output<void>();

  constructor() {
    effect(() => {
      const elementoDialogo = this.dialogo()?.nativeElement;
      if (!elementoDialogo) return;

      if (this.abierto() && !elementoDialogo.open) {
        const elementoActivo = this.documento.activeElement;
        this.elementoActivador = elementoActivo instanceof HTMLElement ? elementoActivo : null;
        elementoDialogo.showModal();
      } else if (!this.abierto() && elementoDialogo.open) {
        elementoDialogo.close();
      }
    });
  }

  solicitarCierre(evento?: Event): void {
    evento?.preventDefault();
    this.solicitudCierre.emit();
  }

  cerrarDesdeFondo(evento: MouseEvent): void {
    if (evento.target === this.dialogo()?.nativeElement) this.solicitarCierre();
  }

  restaurarFoco(): void {
    queueMicrotask(() => this.elementoActivador?.focus());
  }
}
