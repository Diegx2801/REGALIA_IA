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
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { obtenerMensajeErrorUsuario } from '../../../../core/http/modelos/error-api.model';
import { BotonDirective } from '../../../../shared/directivas/boton.directive';
import { confirmarAccionCritica } from '../../../../shared/utilidades/confirmar-accion.util';
import { EstadoPantallaComponent } from '../../../../shared/ui/estado-pantalla/estado-pantalla';
import { FiltrosPanelComponent } from '../../../../shared/ui/filtros-panel/filtros-panel';
import { GrupoMetricasPanelComponent } from '../../../../shared/ui/grupo-metricas-panel/grupo-metricas-panel';
import { PaginacionPanelComponent } from '../../../../shared/ui/paginacion-panel/paginacion-panel';
import { TarjetaMetricaComponent } from '../../../../shared/ui/tarjeta-metrica/tarjeta-metrica';
import {
  ConsultaTiendasAdmin,
  PanelAdministracionApiService,
} from '../../acceso-datos/panel-administracion-api.service';
import { TiendaAdministracion } from '../../modelos/panel-administracion.model';

type CampoBusquedaTienda = NonNullable<ConsultaTiendasAdmin['searchField']>;
type EstadoRevisionTienda = NonNullable<ConsultaTiendasAdmin['estadoRevision']>;
type OrdenTiendas = NonNullable<ConsultaTiendasAdmin['sort']>;
type AccionModeracionTienda = 'aprobar' | 'observar' | 'rechazar';

interface TiendaEnProceso {
  idTienda: number;
  accion: AccionModeracionTienda;
}

@Component({
  selector: 'app-pagina-admin-tiendas',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    BotonDirective,
    EstadoPantallaComponent,
    FiltrosPanelComponent,
    GrupoMetricasPanelComponent,
    PaginacionPanelComponent,
    TarjetaMetricaComponent,
  ],
  templateUrl: './pagina-admin-tiendas.html',
  styleUrl: './pagina-admin-tiendas.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaAdminTiendas implements OnInit {
  private readonly adminApi = inject(PanelAdministracionApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly tiendas = signal<TiendaAdministracion[]>([]);
  readonly totalTiendas = signal(0);
  readonly paginaActual = signal(0);
  readonly totalPaginas = signal(0);
  readonly cargando = signal(true);
  readonly cargaCompletada = signal(false);
  readonly tiendaEnProceso = signal<TiendaEnProceso | null>(null);
  readonly mensajeErrorCarga = signal<string | null>(null);
  readonly mensajeErrorAccion = signal<string | null>(null);
  readonly mensajeExito = signal<string | null>(null);

  readonly pendientesPagina = computed(
    () => this.tiendas().filter((tienda) => tienda.estadoRevision === 'PENDIENTE').length,
  );
  readonly formalizadasPagina = computed(
    () => this.tiendas().filter((tienda) => tienda.formalizada).length,
  );
  readonly aprobadasPagina = computed(
    () => this.tiendas().filter((tienda) => tienda.estadoRevision === 'APROBADA').length,
  );

  readonly formularioFiltros = new FormGroup({
    estadoRevision: new FormControl<EstadoRevisionTienda | 'TODOS'>('TODOS', {
      nonNullable: true,
    }),
    campoBusqueda: new FormControl<CampoBusquedaTienda>('nombre', { nonNullable: true }),
    busqueda: new FormControl('', { nonNullable: true }),
    orden: new FormControl<OrdenTiendas>('fechaCreacion,desc', { nonNullable: true }),
    tamanioPagina: new FormControl<10 | 20 | 50>(10, { nonNullable: true }),
  });

  ngOnInit(): void {
    this.cargarTiendas();
  }

  cargarTiendas(conservarMensajes = false): void {
    this.cargando.set(true);
    this.mensajeErrorCarga.set(null);
    if (!conservarMensajes) {
      this.mensajeErrorAccion.set(null);
      this.mensajeExito.set(null);
    }

    this.adminApi
      .obtenerTiendas(this.crearConsulta())
      .pipe(
        finalize(() => this.cargando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (pagina) => {
          this.tiendas.set(pagina.contenido);
          this.totalTiendas.set(pagina.totalElementos);
          this.totalPaginas.set(pagina.totalPaginas);
          this.cargaCompletada.set(true);
        },
        error: (error: unknown) =>
          this.mensajeErrorCarga.set(
            obtenerMensajeErrorUsuario(error, 'No pudimos cargar las tiendas.'),
          ),
      });
  }

  aplicarFiltros(): void {
    this.paginaActual.set(0);
    this.cargarTiendas();
  }

  limpiarFiltros(): void {
    this.formularioFiltros.reset({
      estadoRevision: 'TODOS',
      campoBusqueda: 'nombre',
      busqueda: '',
      orden: 'fechaCreacion,desc',
      tamanioPagina: 10,
    });
    this.aplicarFiltros();
  }

  paginaAnterior(): void {
    if (this.paginaActual() === 0 || this.cargando()) return;
    this.paginaActual.update((pagina) => pagina - 1);
    this.cargarTiendas();
  }

  paginaSiguiente(): void {
    if (this.paginaActual() + 1 >= this.totalPaginas() || this.cargando()) return;
    this.paginaActual.update((pagina) => pagina + 1);
    this.cargarTiendas();
  }

  aprobarTienda(tienda: TiendaAdministracion): void {
    this.cambiarEstadoTienda(tienda, 'aprobar');
  }

  observarTienda(tienda: TiendaAdministracion): void {
    this.cambiarEstadoTienda(tienda, 'observar');
  }

  rechazarTienda(tienda: TiendaAdministracion): void {
    this.cambiarEstadoTienda(tienda, 'rechazar');
  }

  estaProcesando(tienda: TiendaAdministracion, accion?: AccionModeracionTienda): boolean {
    const proceso = this.tiendaEnProceso();
    return proceso?.idTienda === tienda.idTienda && (!accion || proceso.accion === accion);
  }

  hayFiltrosActivos(): boolean {
    const filtros = this.formularioFiltros.getRawValue();
    return filtros.estadoRevision !== 'TODOS' || filtros.busqueda.trim().length > 0;
  }

  etiquetaEstado(estadoRevision: string): string {
    const etiquetas: Record<string, string> = {
      PENDIENTE: 'Pendiente',
      APROBADA: 'Aprobada',
      OBSERVADA: 'Observada',
      RECHAZADA: 'Rechazada',
    };
    return etiquetas[estadoRevision] ?? estadoRevision;
  }

  private cambiarEstadoTienda(tienda: TiendaAdministracion, accion: AccionModeracionTienda): void {
    if (!this.confirmarModeracionTienda(tienda, accion)) return;

    this.tiendaEnProceso.set({ idTienda: tienda.idTienda, accion });
    this.mensajeErrorAccion.set(null);
    this.mensajeExito.set(null);

    const operacion =
      accion === 'aprobar'
        ? this.adminApi.aprobarTienda(tienda.idTienda)
        : accion === 'observar'
          ? this.adminApi.observarTienda(tienda.idTienda)
          : this.adminApi.rechazarTienda(tienda.idTienda);

    operacion
      .pipe(
        finalize(() => this.tiendaEnProceso.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (tiendaActualizada) => {
          this.tiendas.update((tiendas) =>
            tiendas.map((item) =>
              item.idTienda === tiendaActualizada.idTienda ? tiendaActualizada : item,
            ),
          );
          this.mensajeExito.set(
            `${tiendaActualizada.nombre} ahora está ${this.etiquetaEstado(tiendaActualizada.estadoRevision).toLowerCase()}.`,
          );
          this.cargarTiendas(true);
        },
        error: (error: unknown) =>
          this.mensajeErrorAccion.set(
            obtenerMensajeErrorUsuario(error, 'No pudimos actualizar el estado de la tienda.'),
          ),
      });
  }

  private confirmarModeracionTienda(
    tienda: TiendaAdministracion,
    accion: AccionModeracionTienda,
  ): boolean {
    const consecuencias: Record<AccionModeracionTienda, string> = {
      aprobar: 'Su estado comercial pasará a APROBADA.',
      observar: 'Quedará marcada como OBSERVADA para revisión.',
      rechazar: 'Su estado comercial pasará a RECHAZADA.',
    };
    return confirmarAccionCritica(
      `Vas a ${accion} la tienda "${tienda.nombre}". ${consecuencias[accion]}`,
    );
  }

  private crearConsulta(): ConsultaTiendasAdmin {
    const filtros = this.formularioFiltros.getRawValue();
    return {
      page: this.paginaActual(),
      size: filtros.tamanioPagina,
      estadoRevision: filtros.estadoRevision === 'TODOS' ? undefined : filtros.estadoRevision,
      searchField: filtros.campoBusqueda,
      search: filtros.busqueda,
      sort: filtros.orden,
    };
  }
}
