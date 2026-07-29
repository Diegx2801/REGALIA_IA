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
import { finalize, Observable, of, switchMap } from 'rxjs';
import { obtenerMensajeErrorUsuario } from '../../../../core/http/modelos/error-api.model';
import { BotonDirective } from '../../../../shared/directivas/boton.directive';
import { RespuestaPaginada } from '../../../../shared/modelos/respuesta-api.model';
import { confirmarAccionCritica } from '../../../../shared/utilidades/confirmar-accion.util';
import { EstadoPantallaComponent } from '../../../../shared/ui/estado-pantalla/estado-pantalla';
import { FiltrosPanelComponent } from '../../../../shared/ui/filtros-panel/filtros-panel';
import { GrupoMetricasPanelComponent } from '../../../../shared/ui/grupo-metricas-panel/grupo-metricas-panel';
import { PaginacionPanelComponent } from '../../../../shared/ui/paginacion-panel/paginacion-panel';
import { TarjetaMetricaComponent } from '../../../../shared/ui/tarjeta-metrica/tarjeta-metrica';
import {
  ConsultaUsuariosAdmin,
  PanelAdministracionApiService,
} from '../../acceso-datos/panel-administracion-api.service';
import { UsuarioAdministracion } from '../../modelos/panel-administracion.model';
import {
  enteroDesdeUrl,
  parametrosDeConsulta,
  textoDesdeUrl,
  valorPermitidoDesdeUrl,
} from '../../utilidades/consulta-admin-url.util';

type CampoBusquedaUsuario = NonNullable<ConsultaUsuariosAdmin['searchField']>;
type OrdenUsuarios = NonNullable<ConsultaUsuariosAdmin['sort']>;

@Component({
  selector: 'app-pagina-admin-usuarios',
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
  templateUrl: './pagina-admin-usuarios.html',
  styleUrl: './pagina-admin-usuarios.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaAdminUsuarios implements OnInit {
  private static readonly TAMANIO_PAGINA = 20;
  private readonly adminApi = inject(PanelAdministracionApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly usuarios = signal<UsuarioAdministracion[]>([]);
  readonly totalUsuarios = signal(0);
  readonly paginaActual = signal(0);
  readonly totalPaginas = signal(0);
  readonly cargando = signal(true);
  readonly cargaCompletada = signal(false);
  readonly procesandoUsuario = signal<number | null>(null);
  readonly mensajeErrorCarga = signal<string | null>(null);
  readonly mensajeErrorAccion = signal<string | null>(null);
  readonly mensajeExito = signal<string | null>(null);

  readonly usuariosActivosPagina = computed(
    () => this.usuarios().filter((usuario) => usuario.estado).length,
  );
  readonly usuariosVerificadosPagina = computed(
    () => this.usuarios().filter((usuario) => usuario.correoVerificado).length,
  );
  hayFiltrosActivos(): boolean {
    const filtros = this.formularioFiltros.getRawValue();
    return filtros.estado !== 'TODOS' || filtros.busqueda.trim().length > 0;
  }

  readonly formularioFiltros = new FormGroup({
    estado: new FormControl<'ACTIVO' | 'INACTIVO' | 'TODOS'>('ACTIVO', { nonNullable: true }),
    campoBusqueda: new FormControl<CampoBusquedaUsuario>('correo', { nonNullable: true }),
    busqueda: new FormControl('', { nonNullable: true }),
    orden: new FormControl<OrdenUsuarios>('fechaCreacion,desc', { nonNullable: true }),
  });

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((parametros) => {
      this.aplicarParametrosUrl(parametros);
      this.cargarUsuarios();
    });
  }

  cargarUsuarios(): void {
    this.cargando.set(true);
    this.mensajeErrorCarga.set(null);

    this.adminApi
      .obtenerUsuarios(this.crearConsultaUsuarios())
      .pipe(
        finalize(() => this.cargando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (pagina) => {
          this.actualizarPagina(pagina);
          this.cargaCompletada.set(true);
        },
        error: (error: unknown) => this.mensajeErrorCarga.set(this.obtenerMensajeError(error)),
      });
  }

  aplicarFiltros(): void {
    this.limpiarMensajesAccion();
    this.actualizarUrlConsulta(0);
  }

  limpiarFiltros(): void {
    this.formularioFiltros.reset({
      estado: 'TODOS',
      campoBusqueda: 'correo',
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

  cambiarEstadoUsuario(usuario: UsuarioAdministracion): void {
    const accion = usuario.estado ? 'desactivar' : 'reactivar';
    const consecuencia = usuario.estado
      ? 'La cuenta perderá inmediatamente el acceso y sus sesiones vigentes dejarán de ser válidas.'
      : 'La cuenta recuperará el acceso a REGALIA.';

    if (
      !confirmarAccionCritica(
        `Confirma que deseas ${accion} la cuenta de ${usuario.nombreCompleto} (${usuario.correo}). ${consecuencia}`,
      )
    ) {
      return;
    }

    this.procesandoUsuario.set(usuario.idUsuario);
    this.limpiarMensajesAccion();

    const operacion = usuario.estado
      ? this.adminApi.desactivarUsuario(usuario.idUsuario)
      : this.adminApi.reactivarUsuario(usuario.idUsuario);

    operacion
      .pipe(
        switchMap(() => this.recargarPaginaValida()),
        finalize(() => this.procesandoUsuario.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (pagina) => {
          this.actualizarPagina(pagina);
          this.mensajeExito.set(
            usuario.estado
              ? `La cuenta de ${usuario.nombreCompleto} fue desactivada.`
              : `La cuenta de ${usuario.nombreCompleto} fue reactivada.`,
          );
        },
        error: (error: unknown) => this.mensajeErrorAccion.set(this.obtenerMensajeError(error)),
      });
  }

  private recargarPaginaValida(): Observable<RespuestaPaginada<UsuarioAdministracion>> {
    return this.adminApi.obtenerUsuarios(this.crearConsultaUsuarios()).pipe(
      switchMap((pagina) => {
        const ultimaPaginaDisponible = Math.max(pagina.totalPaginas - 1, 0);
        if (this.paginaActual() <= ultimaPaginaDisponible) return of(pagina);

        this.paginaActual.set(ultimaPaginaDisponible);
        return this.adminApi.obtenerUsuarios(this.crearConsultaUsuarios());
      }),
    );
  }

  private crearConsultaUsuarios(): ConsultaUsuariosAdmin {
    const filtros = this.formularioFiltros.getRawValue();
    return {
      page: this.paginaActual(),
      size: PaginaAdminUsuarios.TAMANIO_PAGINA,
      estado: filtros.estado,
      searchField: filtros.campoBusqueda,
      search: filtros.busqueda,
      sort: filtros.orden,
    };
  }

  private aplicarParametrosUrl(parametros: import('@angular/router').ParamMap): void {
    const estado = valorPermitidoDesdeUrl(parametros, 'estado', 'ACTIVO', [
      'ACTIVO',
      'INACTIVO',
      'TODOS',
    ] as const);
    const campoBusqueda = valorPermitidoDesdeUrl(parametros, 'campo', 'correo', [
      'nombre',
      'correo',
      'telefono',
      'id_usuario',
    ] as const);
    const orden = valorPermitidoDesdeUrl(parametros, 'orden', 'fechaCreacion,desc', [
      'idUsuario,asc', 'idUsuario,desc', 'nombre,asc', 'nombre,desc', 'correo,asc', 'correo,desc',
      'fechaCreacion,asc', 'fechaCreacion,desc',
    ] as const);
    this.paginaActual.set(enteroDesdeUrl(parametros, 'pagina', 0));
    this.formularioFiltros.patchValue({
      estado,
      campoBusqueda,
      busqueda: textoDesdeUrl(parametros, 'buscar', ''),
      orden,
    }, { emitEvent: false });
  }

  private actualizarUrlConsulta(pagina: number): void {
    const filtros = this.formularioFiltros.getRawValue();
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: parametrosDeConsulta(
        {
          estado: filtros.estado,
          campo: filtros.campoBusqueda,
          buscar: filtros.busqueda.trim(),
          orden: filtros.orden,
          pagina,
        },
        { estado: 'ACTIVO', campo: 'correo', buscar: '', orden: 'fechaCreacion,desc', pagina: 0 },
      ),
      replaceUrl: true,
    });
  }

  private actualizarPagina(pagina: RespuestaPaginada<UsuarioAdministracion>): void {
    this.usuarios.set(pagina.contenido);
    this.totalUsuarios.set(pagina.totalElementos);
    this.totalPaginas.set(pagina.totalPaginas);
  }

  private limpiarMensajesAccion(): void {
    this.mensajeErrorAccion.set(null);
    this.mensajeExito.set(null);
  }

  private obtenerMensajeError(error: unknown): string {
    return obtenerMensajeErrorUsuario(error, 'No pudimos completar la gestión del usuario.');
  }
}
