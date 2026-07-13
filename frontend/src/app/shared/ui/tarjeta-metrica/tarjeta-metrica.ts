import { Component, input } from '@angular/core';

@Component({
  selector: 'app-tarjeta-metrica',
  templateUrl: './tarjeta-metrica.html',
  styleUrl: './tarjeta-metrica.css',
})
export class TarjetaMetricaComponent {
  readonly etiqueta = input.required<string>();
  readonly valor = input.required<number | string | null>();
  readonly descripcion = input.required<string | null>();
}
