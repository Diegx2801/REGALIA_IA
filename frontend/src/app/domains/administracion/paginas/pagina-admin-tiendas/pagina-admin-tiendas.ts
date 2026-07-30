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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { obtenerMensajeErrorUsuario } from '../../../../core/http/modelos/error-api.model';
import { BotonDirective } from '../../../../shared/directivas/boton.directive';
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
import { enteroDesdeUrl, parametrosDeConsulta, textoDesdeUrl, valorPermitidoDesdeUrl } from '../../utilidades/consulta-admin-url.util';

type CampoBusquedaTienda = NonNullable<ConsultaTiendasAdmin['searchField']>;
type EstadoRevisionTienda = NonNullable<ConsultaTiendasAdmin['estadoRevision']>;
type OrdenTiendas = NonNullable<ConsultaTiendasAdmin['sort']>;
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
  private static readonly TAMANIO_PAGINA = 20;
  private readonly adminApi = inject(PanelAdministracionApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly tiendas = signal<TiendaAdministracion[]>([]);
  readonly totalTiendas = signal(0);
  readonly paginaActual = signal(0);
  readonly totalPaginas = signal(0);
  readonly cargando = signal(true);
  readonly cargaCompletada = signal(false);
  readonly mensajeErrorCarga = signal<string | null>(null);

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
  });

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((parametros) => {
      this.aplicarParametrosUrl(parametros);
      this.cargarTiendas();
    });
  }

  cargarTiendas(): void {
    this.cargando.set(true);
    this.mensajeErrorCarga.set(null);

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
    this.actualizarUrlConsulta(0);
  }

  limpiarFiltros(): void {
    this.formularioFiltros.reset({
      estadoRevision: 'TODOS',
      campoBusqueda: 'nombre',
      busqueda: '',
      orden: 'fechaCreacion,desc',
    });
    this.actualizarUrlConsulta(0);
  }

  paginaAnterior(): void {
    if (this.paginaActual() === 0 || this.cargando()) return;
    this.actualizarUrlConsulta(this.paginaActual() - 1);
  }

  paginaSiguiente(): void {
    if (this.paginaActual() + 1 >= this.totalPaginas() || this.cargando()) return;
    this.actualizarUrlConsulta(this.paginaActual() + 1);
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

  private crearConsulta(): ConsultaTiendasAdmin {
    const filtros = this.formularioFiltros.getRawValue();
    return {
      page: this.paginaActual(),
      size: PaginaAdminTiendas.TAMANIO_PAGINA,
      estadoRevision: filtros.estadoRevision === 'TODOS' ? undefined : filtros.estadoRevision,
      searchField: filtros.campoBusqueda,
      search: filtros.busqueda,
      sort: filtros.orden,
    };
  }

  private aplicarParametrosUrl(parametros: import('@angular/router').ParamMap): void {
    const estadoRevision = valorPermitidoDesdeUrl(parametros, 'estado', 'TODOS', ['PENDIENTE', 'APROBADA', 'OBSERVADA', 'RECHAZADA', 'TODOS'] as const);
    const campoBusqueda = valorPermitidoDesdeUrl(parametros, 'campo', 'nombre', ['nombre', 'vendedor', 'correo_vendedor', 'id_tienda'] as const);
    const orden = valorPermitidoDesdeUrl(parametros, 'orden', 'fechaCreacion,desc', [
      'idTienda,asc', 'idTienda,desc', 'nombre,asc', 'nombre,desc', 'estadoRevision,asc', 'estadoRevision,desc',
      'nombreVendedor,asc', 'nombreVendedor,desc', 'fechaCreacion,asc', 'fechaCreacion,desc',
    ] as const);
    this.paginaActual.set(enteroDesdeUrl(parametros, 'pagina', 0));
    this.formularioFiltros.patchValue({ estadoRevision, campoBusqueda, orden,
      busqueda: textoDesdeUrl(parametros, 'buscar', ''),
    }, { emitEvent: false });
  }

  private actualizarUrlConsulta(pagina: number): void {
    const filtros = this.formularioFiltros.getRawValue();
    void this.router.navigate([], { relativeTo: this.route, replaceUrl: true,
      queryParams: parametrosDeConsulta(
        { estado: filtros.estadoRevision, campo: filtros.campoBusqueda, buscar: filtros.busqueda.trim(),
          orden: filtros.orden, pagina },
        { estado: 'TODOS', campo: 'nombre', buscar: '', orden: 'fechaCreacion,desc', pagina: 0 },
      ),
    });
  }
}
