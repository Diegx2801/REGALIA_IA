import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { finalize, switchMap } from 'rxjs';
import { obtenerMensajeErrorUsuario } from '../../../../core/http/modelos/error-api.model';
import { BotonDirective } from '../../../../shared/directivas/boton.directive';
import { DialogoUi } from '../../../../shared/ui/dialogo-ui/dialogo-ui';
import { EstadoPantallaComponent } from '../../../../shared/ui/estado-pantalla/estado-pantalla';
import { InsigniaUi } from '../../../../shared/ui/insignia-ui/insignia-ui';
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

type EstadoFiltroDatoMaestro = 'TODOS' | 'ACTIVOS' | 'INACTIVOS';

interface EstadoFormularioDatoMaestro {
  readonly tipo: TipoDatoMaestroAdmin;
  readonly dato: DatoMaestroAdmin | null;
}

interface FiltrosDatosMaestros {
  readonly busqueda: string;
  readonly estado: EstadoFiltroDatoMaestro;
}

@Component({
  selector: 'app-pagina-admin-datos-maestros',
  imports: [
    BotonDirective,
    DatePipe,
    DialogoUi,
    EstadoPantallaComponent,
    FormularioDatoMaestro,
    InsigniaUi,
    ReactiveFormsModule,
    TarjetaMetricaComponent,
  ],
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
  readonly formularioActivo = signal<EstadoFormularioDatoMaestro | null>(null);
  readonly datoPendienteEstado = signal<DatoMaestroAdmin | null>(null);
  readonly filtrosAplicados = signal<FiltrosDatosMaestros>({ busqueda: '', estado: 'TODOS' });
  readonly cargando = signal(true);
  readonly cargaCompletada = signal(false);
  readonly guardando = signal(false);
  readonly procesandoEstado = signal<string | null>(null);
  readonly mensajeError = signal<string | null>(null);
  readonly mensajeExito = signal<string | null>(null);

  readonly formularioFiltros = new FormGroup({
    busqueda: new FormControl('', { nonNullable: true }),
    estado: new FormControl<EstadoFiltroDatoMaestro>('TODOS', { nonNullable: true }),
  });

  readonly configuracionSeleccionada = computed(() =>
    obtenerConfiguracionDatoMaestro(this.tipoSeleccionado()),
  );
  readonly datosDeCategoria = computed(() =>
    this.datosMaestros().filter((dato) => dato.tipo === this.tipoSeleccionado()),
  );
  readonly datosFiltrados = computed(() => {
    const filtros = this.filtrosAplicados();
    const busqueda = this.normalizarTexto(filtros.busqueda);

    return this.datosDeCategoria()
      .filter((dato) => {
        const coincideEstado =
          filtros.estado === 'TODOS' ||
          (filtros.estado === 'ACTIVOS' ? dato.estado : !dato.estado);
        const contenido = this.normalizarTexto(
          [dato.nombre, dato.descripcion, dato.codigo, dato.abreviatura, dato.id].join(' '),
        );
        return coincideEstado && (!busqueda || contenido.includes(busqueda));
      })
      .sort((a, b) => Number(b.estado) - Number(a.estado) || a.nombre.localeCompare(b.nombre, 'es'));
  });
  readonly totalActivos = computed(() => this.datosMaestros().filter((dato) => dato.estado).length);
  readonly totalInactivos = computed(() => this.datosMaestros().length - this.totalActivos());
  readonly activosSeleccionados = computed(() =>
    this.datosDeCategoria().filter((dato) => dato.estado).length,
  );
  readonly inactivosSeleccionados = computed(
    () => this.datosDeCategoria().length - this.activosSeleccionados(),
  );
  readonly categoriasDocumento = computed<readonly CategoriaDocumentoAdmin[]>(() => {
    const categorias = new Map<number, string>();

    this.datosMaestros().forEach((dato) => {
      if (dato.idCategoriaDocumento && dato.categoriaDocumento) {
        categorias.set(dato.idCategoriaDocumento, dato.categoriaDocumento);
      }
    });

    return Array.from(categorias, ([id, nombre]) => ({ id, nombre })).sort((a, b) =>
      a.nombre.localeCompare(b.nombre, 'es'),
    );
  });
  readonly puedeCrearSeleccionado = computed(() => {
    const configuracion = this.configuracionSeleccionada();
    return (
      configuracion.permiteCrear &&
      (configuracion.tipo !== 'TIPO_DOCUMENTO' || this.categoriasDocumento().length > 0)
    );
  });
  readonly hayFiltrosActivos = computed(() => {
    const filtros = this.filtrosAplicados();
    return Boolean(filtros.busqueda.trim()) || filtros.estado !== 'TODOS';
  });

  ngOnInit(): void {
    this.cargarDatosMaestros();
  }

  cargarDatosMaestros(esActualizacion = false): void {
    this.cargando.set(true);
    this.mensajeError.set(null);

    this.datosMaestrosApi
      .obtenerDatosMaestros()
      .pipe(
        finalize(() => this.cargando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (datos) => {
          this.datosMaestros.set(datos);
          this.cargaCompletada.set(true);
          if (esActualizacion) this.mensajeExito.set('Catálogos actualizados correctamente.');
        },
        error: (error: unknown) => this.mensajeError.set(this.obtenerMensajeError(error)),
      });
  }

  seleccionarTipo(tipo: TipoDatoMaestroAdmin): void {
    this.tipoSeleccionado.set(tipo);
    this.formularioActivo.set(null);
    this.limpiarFiltros();
    this.limpiarMensajes();
  }

  aplicarFiltros(): void {
    const valores = this.formularioFiltros.getRawValue();
    this.filtrosAplicados.set({ busqueda: valores.busqueda.trim(), estado: valores.estado });
  }

  limpiarFiltros(): void {
    this.formularioFiltros.reset({ busqueda: '', estado: 'TODOS' });
    this.filtrosAplicados.set({ busqueda: '', estado: 'TODOS' });
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

  solicitarCambioEstado(dato: DatoMaestroAdmin): void {
    const configuracion = obtenerConfiguracionDatoMaestro(dato.tipo);
    if (!configuracion.permiteCambiarEstado || this.procesandoEstado()) return;
    this.datoPendienteEstado.set(dato);
  }

  cancelarCambioEstado(): void {
    if (this.procesandoEstado()) return;
    this.datoPendienteEstado.set(null);
  }

  confirmarCambioEstado(): void {
    const dato = this.datoPendienteEstado();
    if (!dato) return;

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
          this.datoPendienteEstado.set(null);
          this.mensajeExito.set(
            dato.estado
              ? 'Dato maestro desactivado correctamente.'
              : 'Dato maestro reactivado correctamente.',
          );
        },
        error: (error: unknown) => {
          this.datoPendienteEstado.set(null);
          this.mensajeError.set(this.obtenerMensajeError(error));
        },
      });
  }

  contarPorTipo(tipo: TipoDatoMaestroAdmin): number {
    return this.datosMaestros().filter((dato) => dato.tipo === tipo).length;
  }

  contarActivosPorTipo(tipo: TipoDatoMaestroAdmin): number {
    return this.datosMaestros().filter((dato) => dato.tipo === tipo && dato.estado).length;
  }

  crearClave(dato: DatoMaestroAdmin): string {
    return `${dato.tipo}-${dato.id}`;
  }

  etiquetaSecundaria(dato: DatoMaestroAdmin): string {
    if (dato.tipo === 'TIPO_PAGO') return `Código interno: ${dato.codigo}`;
    if (dato.tipo === 'TIPO_DOCUMENTO') return `Abreviatura: ${dato.abreviatura}`;
    return `Registro #${dato.id}`;
  }

  detalleOperativo(dato: DatoMaestroAdmin): string {
    if (dato.tipo === 'TIPO_DOCUMENTO') {
      const rango =
        dato.longitudMinima !== null && dato.longitudMaxima !== null
          ? `${dato.longitudMinima}–${dato.longitudMaxima} caracteres`
          : 'Longitud no configurada';
      return `${dato.categoriaDocumento ?? 'Sin categoría'} · ${rango}`;
    }
    return dato.descripcion;
  }

  fechaReferencia(dato: DatoMaestroAdmin): string | null {
    return dato.fechaActualizacion ?? dato.fechaCreacion;
  }

  private limpiarMensajes(): void {
    this.mensajeError.set(null);
    this.mensajeExito.set(null);
  }

  private normalizarTexto(valor: string): string {
    return valor
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('es')
      .trim();
  }

  private obtenerMensajeError(error: unknown): string {
    return obtenerMensajeErrorUsuario(error, 'No pudimos completar la gestión del dato maestro.');
  }
}
