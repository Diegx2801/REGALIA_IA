import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, switchMap } from 'rxjs';
import { obtenerMensajeErrorUsuario } from '../../../../core/http/modelos/error-api.model';
import { BotonDirective } from '../../../../shared/directivas/boton.directive';
import { confirmarAccionCritica } from '../../../../shared/utilidades/confirmar-accion.util';
import { EstadoPantallaComponent } from '../../../../shared/ui/estado-pantalla/estado-pantalla';
import { FilaPanelComponent } from '../../../../shared/ui/fila-panel/fila-panel';
import { InsigniaUi } from '../../../../shared/ui/insignia-ui/insignia-ui';
import { ListaPanelComponent } from '../../../../shared/ui/lista-panel/lista-panel';
import { TarjetaMetricaComponent } from '../../../../shared/ui/tarjeta-metrica/tarjeta-metrica';
import { DatosMaestrosAdminApiService } from '../../acceso-datos/datos-maestros-admin-api.service';
import { FormularioDatoMaestro } from '../../componentes/formulario-dato-maestro/formulario-dato-maestro';
import {
  CategoriaDocumentoAdmin,
  CONFIGURACIONES_DATOS_MAESTROS,
  DatoMaestroAdmin,
  obtenerConfiguracionDatoMaestro,
  SolicitudGuardarDatoMaestro,
  TipoDatoMaestroAdmin,
} from '../../modelos/dato-maestro-admin.model';

interface EstadoFormularioDatoMaestro {
  readonly tipo: TipoDatoMaestroAdmin;
  readonly dato: DatoMaestroAdmin | null;
}

@Component({
  selector: 'app-pagina-admin-datos-maestros',
  imports: [
    BotonDirective,
    EstadoPantallaComponent,
    FilaPanelComponent,
    FormularioDatoMaestro,
    InsigniaUi,
    ListaPanelComponent,
    TarjetaMetricaComponent,
  ],
  templateUrl: './pagina-admin-datos-maestros.html',
  styleUrl: './pagina-admin-datos-maestros.css',
})
export class PaginaAdminDatosMaestros implements OnInit {
  private readonly datosMaestrosApi = inject(DatosMaestrosAdminApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly configuraciones = CONFIGURACIONES_DATOS_MAESTROS;
  readonly datosMaestros = signal<DatoMaestroAdmin[]>([]);
  readonly tipoSeleccionado = signal<TipoDatoMaestroAdmin>('RUBRO');
  readonly formularioActivo = signal<EstadoFormularioDatoMaestro | null>(null);
  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly procesandoEstado = signal<string | null>(null);
  readonly mensajeError = signal<string | null>(null);
  readonly mensajeExito = signal<string | null>(null);

  readonly configuracionSeleccionada = computed(() =>
    obtenerConfiguracionDatoMaestro(this.tipoSeleccionado()),
  );
  readonly datosFiltrados = computed(() =>
    this.datosMaestros().filter((dato) => dato.tipo === this.tipoSeleccionado()),
  );
  readonly totalActivos = computed(() => this.datosMaestros().filter((dato) => dato.estado).length);
  readonly categoriasDocumento = computed<readonly CategoriaDocumentoAdmin[]>(() => {
    const categorias = new Map<number, string>();

    this.datosMaestros().forEach((dato) => {
      if (dato.idCategoriaDocumento && dato.categoriaDocumento) {
        categorias.set(dato.idCategoriaDocumento, dato.categoriaDocumento);
      }
    });

    return Array.from(categorias, ([id, nombre]) => ({ id, nombre })).sort((a, b) =>
      a.nombre.localeCompare(b.nombre),
    );
  });
  readonly puedeCrearSeleccionado = computed(() => {
    const configuracion = this.configuracionSeleccionada();
    return (
      configuracion.permiteCrear &&
      (configuracion.tipo !== 'TIPO_DOCUMENTO' || this.categoriasDocumento().length > 0)
    );
  });

  ngOnInit(): void {
    this.cargarDatosMaestros();
  }

  cargarDatosMaestros(): void {
    this.cargando.set(true);
    this.mensajeError.set(null);

    this.datosMaestrosApi
      .obtenerDatosMaestros()
      .pipe(
        finalize(() => this.cargando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (datos) => this.datosMaestros.set(datos),
        error: (error: unknown) => this.mensajeError.set(this.obtenerMensajeError(error)),
      });
  }

  seleccionarTipo(evento: Event): void {
    this.tipoSeleccionado.set((evento.target as HTMLSelectElement).value as TipoDatoMaestroAdmin);
    this.formularioActivo.set(null);
    this.limpiarMensajes();
  }

  abrirCreacion(): void {
    if (!this.puedeCrearSeleccionado()) return;
    this.formularioActivo.set({ tipo: this.tipoSeleccionado(), dato: null });
    this.limpiarMensajes();
  }

  abrirEdicion(dato: DatoMaestroAdmin): void {
    if (!dato.estado) return;
    this.formularioActivo.set({ tipo: dato.tipo, dato });
    this.limpiarMensajes();
  }

  cerrarFormulario(): void {
    if (this.guardando()) return;
    this.formularioActivo.set(null);
  }

  guardarDatoMaestro(solicitud: SolicitudGuardarDatoMaestro): void {
    const esEdicion = solicitud.id !== null;
    this.guardando.set(true);
    this.mensajeError.set(null);
    this.mensajeExito.set(null);

    this.datosMaestrosApi
      .guardarDatoMaestro(solicitud)
      .pipe(
        switchMap(() => this.datosMaestrosApi.obtenerDatosMaestros()),
        finalize(() => this.guardando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (datos) => {
          this.datosMaestros.set(datos);
          this.formularioActivo.set(null);
          this.mensajeExito.set(
            esEdicion
              ? 'Dato maestro actualizado correctamente.'
              : 'Dato maestro creado correctamente.',
          );
        },
        error: (error: unknown) => this.mensajeError.set(this.obtenerMensajeError(error)),
      });
  }

  cambiarEstado(dato: DatoMaestroAdmin): void {
    const configuracion = obtenerConfiguracionDatoMaestro(dato.tipo);
    if (!configuracion.permiteCambiarEstado) return;

    const accion = dato.estado ? 'desactivar' : 'reactivar';
    if (!confirmarAccionCritica(`Vas a ${accion} el ${configuracion.singular} "${dato.nombre}".`)) {
      return;
    }

    this.procesandoEstado.set(this.crearClave(dato));
    this.mensajeError.set(null);
    this.mensajeExito.set(null);

    this.datosMaestrosApi
      .cambiarEstadoDatoMaestro(dato)
      .pipe(
        switchMap(() => this.datosMaestrosApi.obtenerDatosMaestros()),
        finalize(() => this.procesandoEstado.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (datos) => {
          this.datosMaestros.set(datos);
          this.mensajeExito.set(
            dato.estado
              ? 'Dato maestro desactivado correctamente.'
              : 'Dato maestro reactivado correctamente.',
          );
        },
        error: (error: unknown) => this.mensajeError.set(this.obtenerMensajeError(error)),
      });
  }

  crearClave(dato: DatoMaestroAdmin): string {
    return `${dato.tipo}-${dato.id}`;
  }

  etiquetaSecundaria(dato: DatoMaestroAdmin): string {
    if (dato.tipo === 'TIPO_PAGO') return `Código interno: ${dato.codigo}`;
    if (dato.tipo === 'TIPO_DOCUMENTO') return `Abreviatura: ${dato.abreviatura}`;
    return `Registro #${dato.id}`;
  }

  private limpiarMensajes(): void {
    this.mensajeError.set(null);
    this.mensajeExito.set(null);
  }

  private obtenerMensajeError(error: unknown): string {
    return obtenerMensajeErrorUsuario(error, 'No pudimos completar la gestión del dato maestro.');
  }
}
