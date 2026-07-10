import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { EstadoPantallaComponent } from '../../../../shared/ui/estado-pantalla/estado-pantalla';
import { FiltrosPanelComponent } from '../../../../shared/ui/filtros-panel/filtros-panel';
import { FilaPanelComponent } from '../../../../shared/ui/fila-panel/fila-panel';
import { GrupoMetricasPanelComponent } from '../../../../shared/ui/grupo-metricas-panel/grupo-metricas-panel';
import { ListaPanelComponent } from '../../../../shared/ui/lista-panel/lista-panel';
import { PaginacionPanelComponent } from '../../../../shared/ui/paginacion-panel/paginacion-panel';
import { TarjetaMetricaComponent } from '../../../../shared/ui/tarjeta-metrica/tarjeta-metrica';
import { PanelAdministracionApiService } from '../../acceso-datos/panel-administracion-api.service';
import { UsuarioAdministracion } from '../../modelos/panel-administracion.model';

@Component({
  selector: 'app-pagina-admin-usuarios',
  imports: [
    DatePipe,
    ReactiveFormsModule,
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
  readonly mensajeError = signal<string | null>(null);
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

    this.adminApi
      .obtenerUsuarios({
        page: this.paginaActual(),
        size: 12,
        estado: this.formularioFiltros.controls.estado.value,
        search: this.formularioFiltros.controls.busqueda.value,
      })
      .pipe(
        finalize(() => this.cargando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (pagina) => {
          this.usuarios.set(pagina.contenido);
          this.totalUsuarios.set(pagina.totalElementos);
          this.totalPaginas.set(pagina.totalPaginas);
        },
        error: (error: Error) => this.mensajeError.set(this.obtenerMensajeError(error)),
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

  private obtenerMensajeError(error: Error): string {
    const mensaje = error.message ?? '';
    return mensaje.includes('Http failure response') || mensaje.includes('Unknown Error')
      ? 'No pudimos conectar con el backend para cargar usuarios.'
      : mensaje || 'No pudimos cargar usuarios.';
  }
}
