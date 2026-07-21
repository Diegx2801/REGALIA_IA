import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-tarjeta-informativa',
  templateUrl: './tarjeta-informativa.html',
  styleUrl: './tarjeta-informativa.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TarjetaInformativa {
  readonly etiqueta = input<string | null>(null);
  readonly titulo = input.required<string>();
  readonly descripcion = input<string | null>(null);
}
