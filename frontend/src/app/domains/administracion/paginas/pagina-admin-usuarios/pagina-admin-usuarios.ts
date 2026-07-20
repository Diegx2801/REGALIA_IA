import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { finalize, Observable, of, switchMap } from 'rxjs';
import { obtenerMensajeErrorUsuario } from '../../../../core/http/modelos/error-api.model';
import { BotonDirective } from '../../../../shared/directivas/boton.directive';
import { RespuestaPaginada } from '../../../../shared/modelos/respuesta-api.model';
import { confirmarAccionCritica } from '../../../../shared/utilidades/confirmar-accion.util';
import { EstadoPantallaComponent } from '../../../../shared/ui/estado-pantalla/estado-pantalla';
import { FiltrosPanelComponent } from '../../../../shared/ui/filtros-panel/filtros-panel';
import { FilaPanelComponent } from '../../../../shared/ui/fila-panel/fila-panel';
import { GrupoMetricasPanelComponent } from '../../../../shared/ui/grupo-metricas-panel/grupo-metricas-panel';
import { ListaPanelComponent } from '../../../../shared/ui/lista-panel/lista-panel';
import { PaginacionPanelComponent } from '../../../../shared/ui/paginacion-panel/paginacion-panel';
import { TarjetaMetricaComponent } from '../../../../shared/ui/tarjeta-metrica/tarjeta-metrica';
import {
  ConsultaUsuariosAdmin,
  PanelAdministracionApiService,
} from '../../acceso-datos/panel-administracion-api.service';
import { UsuarioAdministracion } from '../../modelos/panel-administracion.model';

@Component({
  selector: 'app-pagina-admin-usuarios',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    BotonDirective,
    EstadoPantallaComponent,
    FiltrosPanelComponent,
    FilaPanelComponent,
    GrupoMetricasPanelComponent,
    ListaPanelComponent,
    PaginacionPanelComponent,
    TarjetaMetricaComponent,
  ],
  templateUrl: './pagina-admin-usuarios.html',
  styleUrl: './pagina-admin-usuarios.css',
})
export class PaginaAdminUsuarios implements OnInit {
  private readonly adminApi = inject(PanelAdministracionApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly usuarios = signal<UsuarioAdministracion[]>([]);
  readonly totalUsuarios = signal(0);
  readonly paginaActual = signal(0);
  readonly totalPaginas = signal(0);
  readonly cargando = signal(true);
  readonly procesandoUsuario = signal<number | null>(null);
  readonly mensajeError = signal<string | null>(null);
  readonly mensajeExito = signal<string | null>(null);
  readonly formularioFiltros = new FormGroup({
    estado: new FormControl<'ACTIVO' | 'INACTIVO' | 'TODOS'>('ACTIVO', { nonNullable: true }),
    busqueda: new FormControl('', { nonNullable: true }),
  });

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.cargando.set(true);
    this.mensajeError.set(null);
    this.mensajeExito.set(null);

    this.adminApi
      .obtenerUsuarios(this.crearConsultaUsuarios())
      .pipe(
        finalize(() => this.cargando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (pagina) => this.actualizarPagina(pagina),
        error: (error: unknown) => this.mensajeError.set(this.obtenerMensajeError(error)),
      });
  }

  aplicarFiltros(): void {
    this.paginaActual.set(0);
    this.cargarUsuarios();
  }

  paginaAnterior(): void {
    if (this.paginaActual() === 0) return;
    this.paginaActual.update((pagina) => pagina - 1);
    this.cargarUsuarios();
  }

  paginaSiguiente(): void {
    if (this.paginaActual() + 1 >= this.totalPaginas()) return;
    this.paginaActual.update((pagina) => pagina + 1);
    this.cargarUsuarios();
  }

  cambiarEstadoUsuario(usuario: UsuarioAdministracion): void {
    const accion = usuario.estado ? 'desactivar' : 'reactivar';
    const consecuencia = usuario.estado
      ? 'La cuenta perderá acceso a REGALIA.'
      : 'La cuenta recuperará el acceso a REGALIA.';

    if (
      !confirmarAccionCritica(
        `Vas a ${accion} la cuenta de "${usuario.nombreCompleto}" (${usuario.correo}). ${consecuencia}`,
      )
    ) {
      return;
    }

    this.procesandoUsuario.set(usuario.idUsuario);
    this.mensajeError.set(null);
    this.mensajeExito.set(null);

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
              ? 'Usuario desactivado correctamente.'
              : 'Usuario reactivado correctamente.',
          );
        },
        error: (error: unknown) => this.mensajeError.set(this.obtenerMensajeError(error)),
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
    return {
      page: this.paginaActual(),
      size: 12,
      estado: this.formularioFiltros.controls.estado.value,
      search: this.formularioFiltros.controls.busqueda.value,
    };
  }

  private actualizarPagina(pagina: RespuestaPaginada<UsuarioAdministracion>): void {
    this.usuarios.set(pagina.contenido);
    this.totalUsuarios.set(pagina.totalElementos);
    this.totalPaginas.set(pagina.totalPaginas);
  }

  private obtenerMensajeError(error: unknown): string {
    return obtenerMensajeErrorUsuario(error, 'No pudimos completar la gestión del usuario.');
  }
}
