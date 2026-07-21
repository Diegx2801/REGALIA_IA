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
  readonly diasSemana = input.required<readonly string[]>();
  readonly anio = input(2026);
  readonly mesActivo = signal('FEB');
  readonly indiceCampanaActiva = signal(-1);
  readonly campanaActiva = computed(() => this.campanas()[this.indiceCampanaActiva()] ?? null);
  readonly diasCalendario = computed<readonly (number | null)[]>(() => {
    const indiceMes = this.meses().indexOf(this.mesActivo());
    if (indiceMes < 0) return [];

    const primerDia = new Date(this.anio(), indiceMes, 1).getDay();
    const espaciosIniciales = (primerDia + 6) % 7;
    const cantidadDias = new Date(this.anio(), indiceMes + 1, 0).getDate();
    return [
      ...Array.from({ length: espaciosIniciales }, () => null),
      ...Array.from({ length: cantidadDias }, (_, indice) => indice + 1),
    ];
  });
  readonly estadoCampana = computed(() => {
    const campana = this.campanaActiva();
    if (!campana) return null;

    const hoy = this.inicioDia(new Date());
    const fecha = this.fechaCampana(campana);
    if (fecha.getTime() === hoy.getTime()) return 'Hoy';
    return fecha > hoy ? 'Próxima campaña' : 'Fecha finalizada';
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
    const indiceInicial = siguiente >= 0 ? siguiente : Math.max(this.campanas().length - 1, 0);
    this.seleccionarCampana(indiceInicial);
  }

  seleccionarCampana(indice: number): void {
    const campana = this.campanas()[indice];
    if (!campana) return;
    this.indiceCampanaActiva.set(indice);
    this.mesActivo.set(campana.mes);
  }

  seleccionarMes(mes: string): void {
    this.mesActivo.set(mes);
    const indiceCampana = this.campanas().findIndex((campana) => campana.mes === mes);
    this.indiceCampanaActiva.set(indiceCampana);
  }

  campanaDelDia(dia: number | null): CampanaComercial | null {
    if (dia === null) return null;
    return (
      this.campanas().find((campana) => campana.mes === this.mesActivo() && campana.dia === dia) ??
      null
    );
  }

  seleccionarDia(dia: number | null): void {
    if (dia === null) return;
    const indice = this.campanas().findIndex(
      (campana) => campana.mes === this.mesActivo() && campana.dia === dia,
    );
    if (indice >= 0) this.seleccionarCampana(indice);
  }

  esDiaActivo(dia: number | null): boolean {
    if (dia === null) return false;
    const campana = this.campanaActiva();
    return campana?.mes === this.mesActivo() && campana.dia === dia;
  }

  private fechaCampana(campana: CampanaComercial): Date {
    return new Date(this.anio(), this.meses().indexOf(campana.mes), campana.dia);
  }

  private inicioDia(fecha: Date): Date {
    return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  }
}
