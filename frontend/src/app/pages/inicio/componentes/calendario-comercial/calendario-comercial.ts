import { ChangeDetectionStrategy, Component, computed, input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CampanaComercial } from '../../modelos/inicio.model';

@Component({
  selector: 'app-calendario-comercial',
  imports: [RouterLink],
  templateUrl: './calendario-comercial.html',
  styleUrl: './calendario-comercial.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarioComercial implements OnInit {
  readonly campanas = input.required<readonly CampanaComercial[]>();
  readonly meses = input.required<readonly string[]>();
  readonly anio = input(2026);
  readonly indiceCampanaActiva = signal(-1);
  readonly campanaActiva = computed(() => this.campanas()[this.indiceCampanaActiva()] ?? null);
  readonly estadoCampana = computed(() => {
    const campana = this.campanaActiva();
    if (!campana) return '';

    const dias = this.diasHastaCampana();
    if (dias === 0) return 'Es hoy';
    if (dias !== null && dias > 0) return `Faltan ${dias} días`;
    return 'Temporada finalizada';
  });
  readonly diasHastaCampana = computed(() => {
    const campana = this.campanaActiva();
    if (!campana) return null;
    return Math.ceil(
      (this.fechaCampana(campana).getTime() - this.inicioDia(new Date()).getTime()) / 86_400_000,
    );
  });

  ngOnInit(): void {
    const hoy = this.inicioDia(new Date());
    const siguiente = this.campanas().findIndex((campana) => this.fechaCampana(campana) >= hoy);
    this.indiceCampanaActiva.set(siguiente >= 0 ? siguiente : Math.max(this.campanas().length - 1, 0));
  }

  seleccionarCampana(indice: number): void {
    if (!this.campanas()[indice]) return;
    this.indiceCampanaActiva.set(indice);
  }

  private fechaCampana(campana: CampanaComercial): Date {
    return new Date(this.anio(), this.meses().indexOf(campana.mes), campana.dia);
  }

  private inicioDia(fecha: Date): Date {
    return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  }
}
