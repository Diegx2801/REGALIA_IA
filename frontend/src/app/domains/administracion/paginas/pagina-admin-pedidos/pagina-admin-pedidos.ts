import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
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
import { PedidoAdministracion } from '../../modelos/panel-administracion.model';

@Component({
  selector: 'app-pagina-admin-pedidos',
  imports: [
    CurrencyPipe,
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
  templateUrl: './pagina-admin-pedidos.html',
  styleUrl: './pagina-admin-pedidos.css',
})
export class PaginaAdminPedidos implements OnInit {
  private readonly adminApi = inject(PanelAdministracionApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly pedidos = signal<PedidoAdministracion[]>([]);
  readonly totalPedidos = signal(0);
  readonly paginaActual = signal(0);
  readonly totalPaginas = signal(0);
  readonly cargando = signal(true);
  readonly mensajeError = signal<string | null>(null);
  readonly formularioFiltros = new FormGroup({
    estadoPago: new FormControl('', { nonNullable: true }),
    busqueda: new FormControl('', { nonNullable: true }),
  });
  readonly montoPagado = computed(() =>
    this.pedidos().reduce((total, pedido) => total + pedido.montoPagado, 0),
  );
  readonly saldoPendiente = computed(() =>
    this.pedidos().reduce((total, pedido) => total + pedido.saldoPendiente, 0),
  );

  ngOnInit(): void {
    this.cargarPedidos();
  }

  cargarPedidos(): void {
    this.cargando.set(true);
    this.mensajeError.set(null);

    this.adminApi
      .obtenerPedidos({
        page: this.paginaActual(),
        size: 12,
        estadoPago: this.formularioFiltros.controls.estadoPago.value || undefined,
        search: this.formularioFiltros.controls.busqueda.value,
      })
      .pipe(
        finalize(() => this.cargando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (pagina) => {
          this.pedidos.set(pagina.contenido);
          this.totalPedidos.set(pagina.totalElementos);
          this.totalPaginas.set(pagina.totalPaginas);
        },
        error: (error: Error) => this.mensajeError.set(this.obtenerMensajeError(error)),
      });
  }

  aplicarFiltros(): void {
    this.paginaActual.set(0);
    this.cargarPedidos();
  }

  paginaAnterior(): void {
    if (this.paginaActual() === 0) return;
    this.paginaActual.update((pagina) => pagina - 1);
    this.cargarPedidos();
  }

  paginaSiguiente(): void {
    if (this.paginaActual() + 1 >= this.totalPaginas()) return;
    this.paginaActual.update((pagina) => pagina + 1);
    this.cargarPedidos();
  }

  private obtenerMensajeError(error: Error): string {
    const mensaje = error.message ?? '';
    return mensaje.includes('Http failure response') || mensaje.includes('Unknown Error')
      ? 'No pudimos conectar con el backend para cargar pedidos.'
      : mensaje || 'No pudimos cargar pedidos.';
  }
}
