import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { obtenerMensajeErrorUsuario } from '../../../../core/http/modelos/error-api.model';
import { BotonDirective } from '../../../../shared/directivas/boton.directive';
import { EstadoPantallaComponent } from '../../../../shared/ui/estado-pantalla/estado-pantalla';
import { InsigniaUi } from '../../../../shared/ui/insignia-ui/insignia-ui';
import { TarjetaMetricaComponent } from '../../../../shared/ui/tarjeta-metrica/tarjeta-metrica';
import { DatosMaestrosAdminApiService } from '../../acceso-datos/datos-maestros-admin-api.service';
import {
  CONFIGURACIONES_DATOS_MAESTROS,
  DatoMaestroAdmin,
  TipoDatoMaestroAdmin,
  obtenerConfiguracionDatoMaestro,
} from '../../modelos/dato-maestro-admin.model';

@Component({
  selector: 'app-pagina-admin-datos-maestros',
  imports: [BotonDirective, DatePipe, EstadoPantallaComponent, InsigniaUi, TarjetaMetricaComponent],
  templateUrl: './pagina-admin-datos-maestros.html',
  styleUrl: './pagina-admin-datos-maestros.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaAdminDatosMaestros implements OnInit {
  private readonly datosMaestrosApi = inject(DatosMaestrosAdminApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly configuraciones = CONFIGURACIONES_DATOS_MAESTROS;
  readonly datosMaestros = signal<DatoMaestroAdmin[]>([]);
  readonly tipoSeleccionado = signal<TipoDatoMaestroAdmin>('RUBRO');
  readonly cargando = signal(true);
  readonly cargaCompletada = signal(false);
  readonly mensajeError = signal<string | null>(null);
  readonly mensajeExito = signal<string | null>(null);

  readonly configuracionSeleccionada = computed(() =>
    obtenerConfiguracionDatoMaestro(this.tipoSeleccionado()),
  );
  readonly datosDeCategoria = computed(() =>
    this.datosMaestros()
      .filter((dato) => dato.tipo === this.tipoSeleccionado())
      .sort((a, b) => Number(b.estado) - Number(a.estado) || a.nombre.localeCompare(b.nombre, 'es')),
  );
  readonly totalActivos = computed(() => this.datosMaestros().filter((dato) => dato.estado).length);
  readonly totalInactivos = computed(() => this.datosMaestros().length - this.totalActivos());
  readonly activosSeleccionados = computed(() => this.datosDeCategoria().filter((dato) => dato.estado).length);

  ngOnInit(): void {
    this.cargarDatosMaestros();
  }

  cargarDatosMaestros(esActualizacion = false): void {
    this.cargando.set(true);
    this.mensajeError.set(null);

    this.datosMaestrosApi
      .obtenerDatosMaestros()
      .pipe(finalize(() => this.cargando.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (datos) => {
          this.datosMaestros.set(datos);
          this.cargaCompletada.set(true);
          this.mensajeExito.set(esActualizacion ? 'Configuracion actualizada.' : null);
        },
        error: (error: unknown) =>
          this.mensajeError.set(
            obtenerMensajeErrorUsuario(error, 'No pudimos cargar la configuracion del marketplace.'),
          ),
      });
  }

  seleccionarTipo(tipo: TipoDatoMaestroAdmin): void {
    this.tipoSeleccionado.set(tipo);
    this.mensajeError.set(null);
    this.mensajeExito.set(null);
  }

  contarPorTipo(tipo: TipoDatoMaestroAdmin): number {
    return this.datosMaestros().filter((dato) => dato.tipo === tipo).length;
  }

  contarActivosPorTipo(tipo: TipoDatoMaestroAdmin): number {
    return this.datosMaestros().filter((dato) => dato.tipo === tipo && dato.estado).length;
  }

  etiquetaSecundaria(dato: DatoMaestroAdmin): string | null {
    if (dato.tipo === 'TIPO_PAGO' && dato.codigo) return dato.codigo;
    if (dato.tipo === 'TIPO_DOCUMENTO' && dato.abreviatura) return dato.abreviatura;
    return null;
  }

  detalleOperativo(dato: DatoMaestroAdmin): string {
    if (dato.tipo === 'TIPO_DOCUMENTO') {
      const rango =
        dato.longitudMinima !== null && dato.longitudMaxima !== null
          ? `${dato.longitudMinima} a ${dato.longitudMaxima} caracteres`
          : null;
      return [dato.categoriaDocumento, rango].filter(Boolean).join(' - ') || 'Uso interno del marketplace.';
    }

    return dato.descripcion;
  }

  fechaReferencia(dato: DatoMaestroAdmin): string | null {
    return dato.fechaActualizacion ?? dato.fechaCreacion;
  }
}
