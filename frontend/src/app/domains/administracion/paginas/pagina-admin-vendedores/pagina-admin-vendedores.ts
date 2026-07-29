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
  ConsultaVendedoresAdmin,
  PanelAdministracionApiService,
} from '../../acceso-datos/panel-administracion-api.service';
import { VendedorAdministracion } from '../../modelos/panel-administracion.model';
import { enteroDesdeUrl, parametrosDeConsulta, textoDesdeUrl, valorPermitidoDesdeUrl } from '../../utilidades/consulta-admin-url.util';

type CampoBusquedaVendedor = NonNullable<ConsultaVendedoresAdmin['searchField']>;
type OrdenVendedores = NonNullable<ConsultaVendedoresAdmin['sort']>;

@Component({
  selector: 'app-pagina-admin-vendedores',
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
  templateUrl: './pagina-admin-vendedores.html',
  styleUrl: './pagina-admin-vendedores.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaAdminVendedores implements OnInit {
  private static readonly TAMANIO_PAGINA = 20;
  private readonly adminApi = inject(PanelAdministracionApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly vendedores = signal<VendedorAdministracion[]>([]);
  readonly totalVendedores = signal(0);
  readonly paginaActual = signal(0);
  readonly totalPaginas = signal(0);
  readonly cargando = signal(true);
  readonly cargaCompletada = signal(false);
  readonly mensajeError = signal<string | null>(null);

  readonly vendedoresVerificadosPagina = computed(
    () => this.vendedores().filter((vendedor) => vendedor.verificado).length,
  );
  readonly vendedoresActivosPagina = computed(
    () => this.vendedores().filter((vendedor) => vendedor.estado).length,
  );
  readonly tiendasActivasPagina = computed(() =>
    this.vendedores().reduce((total, vendedor) => total + vendedor.tiendasActivas, 0),
  );

  readonly formularioFiltros = new FormGroup({
    estado: new FormControl<'ACTIVO' | 'INACTIVO' | 'TODOS'>('TODOS', { nonNullable: true }),
    verificacion: new FormControl<'VERIFICADO' | 'SIN_VERIFICAR' | 'TODOS'>('TODOS', {
      nonNullable: true,
    }),
    campoBusqueda: new FormControl<CampoBusquedaVendedor>('nombre', { nonNullable: true }),
    busqueda: new FormControl('', { nonNullable: true }),
    orden: new FormControl<OrdenVendedores>('fechaCreacion,desc', { nonNullable: true }),
  });

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((parametros) => {
      this.aplicarParametrosUrl(parametros);
      this.cargarVendedores();
    });
  }

  cargarVendedores(): void {
    this.cargando.set(true);
    this.mensajeError.set(null);

    this.adminApi
      .obtenerVendedores(this.crearConsulta())
      .pipe(
        finalize(() => this.cargando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (pagina) => {
          this.vendedores.set(pagina.contenido);
          this.totalVendedores.set(pagina.totalElementos);
          this.totalPaginas.set(pagina.totalPaginas);
          this.cargaCompletada.set(true);
        },
        error: (error: unknown) =>
          this.mensajeError.set(
            obtenerMensajeErrorUsuario(error, 'No pudimos cargar los vendedores.'),
          ),
      });
  }

  aplicarFiltros(): void {
    this.actualizarUrlConsulta(0);
  }

  limpiarFiltros(): void {
    this.formularioFiltros.reset({
      estado: 'TODOS',
      verificacion: 'TODOS',
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
    return (
      filtros.estado !== 'TODOS' ||
      filtros.verificacion !== 'TODOS' ||
      filtros.busqueda.trim().length > 0
    );
  }

  private crearConsulta(): ConsultaVendedoresAdmin {
    const filtros = this.formularioFiltros.getRawValue();
    return {
      page: this.paginaActual(),
      size: PaginaAdminVendedores.TAMANIO_PAGINA,
      estado: filtros.estado,
      verificacion: filtros.verificacion,
      searchField: filtros.campoBusqueda,
      search: filtros.busqueda,
      sort: filtros.orden,
    };
  }

  private aplicarParametrosUrl(parametros: import('@angular/router').ParamMap): void {
    const estado = valorPermitidoDesdeUrl(parametros, 'estado', 'TODOS', ['ACTIVO', 'INACTIVO', 'TODOS'] as const);
    const verificacion = valorPermitidoDesdeUrl(parametros, 'verificacion', 'TODOS', ['VERIFICADO', 'SIN_VERIFICAR', 'TODOS'] as const);
    const campoBusqueda = valorPermitidoDesdeUrl(parametros, 'campo', 'nombre', ['nombre', 'correo', 'id_vendedor', 'id_usuario'] as const);
    const orden = valorPermitidoDesdeUrl(parametros, 'orden', 'fechaCreacion,desc', [
      'idVendedor,asc', 'idVendedor,desc', 'idUsuario,asc', 'idUsuario,desc', 'nombre,asc', 'nombre,desc',
      'correo,asc', 'correo,desc', 'fechaCreacion,asc', 'fechaCreacion,desc',
    ] as const);
    this.paginaActual.set(enteroDesdeUrl(parametros, 'pagina', 0));
    this.formularioFiltros.patchValue({ estado, verificacion, campoBusqueda, orden,
      busqueda: textoDesdeUrl(parametros, 'buscar', ''),
    }, { emitEvent: false });
  }

  private actualizarUrlConsulta(pagina: number): void {
    const filtros = this.formularioFiltros.getRawValue();
    void this.router.navigate([], { relativeTo: this.route, replaceUrl: true,
      queryParams: parametrosDeConsulta(
        { estado: filtros.estado, verificacion: filtros.verificacion, campo: filtros.campoBusqueda,
          buscar: filtros.busqueda.trim(), orden: filtros.orden, pagina },
        { estado: 'TODOS', verificacion: 'TODOS', campo: 'nombre', buscar: '', orden: 'fechaCreacion,desc', pagina: 0 },
      ),
    });
  }
}
