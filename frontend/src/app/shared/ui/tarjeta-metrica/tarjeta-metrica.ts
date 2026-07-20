import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type IconoTarjetaMetrica =
  | 'tendencia'
  | 'tiendas'
  | 'productos'
  | 'pedidos'
  | 'ingresos'
  | 'visibilidad'
  | 'alerta'
  | 'pausa';

@Component({
  selector: 'app-tarjeta-metrica',
  templateUrl: './tarjeta-metrica.html',
  styleUrl: './tarjeta-metrica.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TarjetaMetricaComponent {
  readonly etiqueta = input.required<string>();
  readonly valor = input.required<number | string | null>();
  readonly descripcion = input.required<string | null>();
  readonly icono = input<IconoTarjetaMetrica>('tendencia');
}
