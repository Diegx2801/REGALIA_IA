import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CampanaComercial } from '../../modelos/inicio.model';

@Component({
  selector: 'app-calendario-comercial',
  imports: [RouterLink],
  templateUrl: './calendario-comercial.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarioComercial {
  readonly campanas = input.required<readonly CampanaComercial[]>();
  readonly meses = input.required<readonly string[]>();
  readonly diasSemana = input.required<readonly string[]>();
  readonly diasFebrero = input.required<readonly number[]>();
  readonly mesActivo = input.required<string>();
  readonly seleccionarMes = output<string>();
  readonly indiceCampanaActiva = signal(0);
  readonly campanaActiva = computed(() => this.campanas()[this.indiceCampanaActiva()] ?? null);

  seleccionarCampana(indice: number): void {
    this.indiceCampanaActiva.set(indice);
  }
}
