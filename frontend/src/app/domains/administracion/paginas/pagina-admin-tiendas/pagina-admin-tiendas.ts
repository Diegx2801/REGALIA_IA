import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { finalize, switchMap } from 'rxjs';
import { BotonDirective } from '../../../../shared/directivas/boton.directive';
import { confirmarAccionCritica } from '../../../../shared/utilidades/confirmar-accion.util';
import { EstadoPantallaComponent } from '../../../../shared/ui/estado-pantalla/estado-pantalla';
import { FiltrosPanelComponent } from '../../../../shared/ui/filtros-panel/filtros-panel';
import { FilaPanelComponent } from '../../../../shared/ui/fila-panel/fila-panel';
import { GrupoMetricasPanelComponent } from '../../../../shared/ui/grupo-metricas-panel/grupo-metricas-panel';
import { ListaPanelComponent } from '../../../../shared/ui/lista-panel/lista-panel';
import { PaginacionPanelComponent } from '../../../../shared/ui/paginacion-panel/paginacion-panel';
import { TarjetaMetricaComponent } from '../../../../shared/ui/tarjeta-metrica/tarjeta-metrica';
import { PanelAdministracionApiService } from '../../acceso-datos/panel-administracion-api.service';
import { TiendaAdministracion } from '../../modelos/panel-administracion.model';

@Component({
  selector: 'app-pagina-admin-tiendas',
  imports: [
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
  templateUrl: './pagina-admin-tiendas.html',
  styleUrl: './pagina-admin-tiendas.css',
})
export class PaginaAdminTiendas implements OnInit {
  private readonly adminApi = inject(PanelAdministracionApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly tiendas = signal<TiendaAdministracion[]>([]);
  readonly totalTiendas = signal(0);
  readonly paginaActual = signal(0);
  readonly totalPaginas = signal(0);
  readonly cargando = signal(true);
  readonly procesandoTienda = signal<number | null>(null);
  readonly mensajeError = signal<string | null>(null);
  readonly mensajeExito = signal<string | null>(null);
  readonly formularioFiltros = new FormGroup({
    estadoRevision: new FormControl('', { nonNullable: true }),
    busqueda: new FormControl('', { nonNullable: true }),
  });

  ngOnInit(): void {
    this.cargarTiendas();
  }

  cargarTiendas(): void {
    this.cargando.set(true);
    this.mensajeError.set(null);

    this.adminApi
      .obtenerTiendas({
        page: this.paginaActual(),
        size: 12,
        estadoRevision: this.formularioFiltros.controls.estadoRevision.value || undefined,
        search: this.formularioFiltros.controls.busqueda.value,
      })
      .pipe(
        finalize(() => this.cargando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (pagina) => {
          this.tiendas.set(pagina.contenido);
          this.totalTiendas.set(pagina.totalElementos);
          this.totalPaginas.set(pagina.totalPaginas);
        },
        error: (error: Error) => this.mensajeError.set(this.obtenerMensajeError(error)),
      });
  }

  aplicarFiltros(): void {
    this.paginaActual.set(0);
    this.cargarTiendas();
  }

  paginaAnterior(): void {
    if (this.paginaActual() === 0) return;
    this.paginaActual.update((pagina) => pagina - 1);
    this.cargarTiendas();
  }

  paginaSiguiente(): void {
    if (this.paginaActual() + 1 >= this.totalPaginas()) return;
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

  private cambiarEstadoTienda(
    tienda: TiendaAdministracion,
    accion: 'aprobar' | 'observar' | 'rechazar',
  ): void {
    if (!this.confirmarModeracionTienda(tienda, accion)) return;

    this.procesandoTienda.set(tienda.idTienda);
    this.mensajeError.set(null);
    this.mensajeExito.set(null);

    const operacion =
      accion === 'aprobar'
        ? this.adminApi.aprobarTienda(tienda.idTienda)
        : accion === 'observar'
          ? this.adminApi.observarTienda(tienda.idTienda)
          : this.adminApi.rechazarTienda(tienda.idTienda);

    // Reconsulta la pagina luego de moderar para evitar estados visuales inconsistentes.
    operacion
      .pipe(
        switchMap(() =>
          this.adminApi.obtenerTiendas({
            page: this.paginaActual(),
            size: 12,
            estadoRevision: this.formularioFiltros.controls.estadoRevision.value || undefined,
            search: this.formularioFiltros.controls.busqueda.value,
          }),
        ),
        finalize(() => this.procesandoTienda.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (pagina) => {
          this.tiendas.set(pagina.contenido);
          this.totalTiendas.set(pagina.totalElementos);
          this.totalPaginas.set(pagina.totalPaginas);
          this.mensajeExito.set('Estado de tienda actualizado correctamente.');
        },
        error: (error: Error) => this.mensajeError.set(this.obtenerMensajeError(error)),
      });
  }

  private confirmarModeracionTienda(
    tienda: TiendaAdministracion,
    accion: 'aprobar' | 'observar' | 'rechazar',
  ): boolean {
    const acciones = {
      aprobar: 'aprobar',
      observar: 'marcar como observada',
      rechazar: 'rechazar',
    };

    return confirmarAccionCritica(`Vas a ${acciones[accion]} la tienda "${tienda.nombre}".`);
  }

  private obtenerMensajeError(error: Error): string {
    const mensaje = error.message ?? '';
    return mensaje.includes('Http failure response') || mensaje.includes('Unknown Error')
      ? 'No pudimos conectar con el backend para cargar tiendas.'
      : mensaje || 'No pudimos cargar tiendas.';
  }
}
