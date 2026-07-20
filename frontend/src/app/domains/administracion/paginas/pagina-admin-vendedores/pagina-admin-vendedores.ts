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
  private readonly adminApi = inject(PanelAdministracionApiService);
  private readonly destroyRef = inject(DestroyRef);

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
    tamanioPagina: new FormControl<10 | 20 | 50>(10, { nonNullable: true }),
  });

  ngOnInit(): void {
    this.cargarVendedores();
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
    this.paginaActual.set(0);
    this.cargarVendedores();
  }

  limpiarFiltros(): void {
    this.formularioFiltros.reset({
      estado: 'TODOS',
      verificacion: 'TODOS',
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
    this.cargarVendedores();
  }

  paginaSiguiente(): void {
    if (this.paginaActual() + 1 >= this.totalPaginas() || this.cargando()) return;
    this.paginaActual.update((pagina) => pagina + 1);
    this.cargarVendedores();
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
      size: filtros.tamanioPagina,
      estado: filtros.estado,
      verificacion: filtros.verificacion,
      searchField: filtros.campoBusqueda,
      search: filtros.busqueda,
      sort: filtros.orden,
    };
  }
}
