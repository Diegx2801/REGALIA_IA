import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { ConsultaPedidosCliente } from '../../acceso-datos/pedido-cliente-api.service';
import { BotonDirective } from '../../../../shared/directivas/boton.directive';
import { EstadoPantallaComponent } from '../../../../shared/ui/estado-pantalla/estado-pantalla';
import { FilaPanelComponent } from '../../../../shared/ui/fila-panel/fila-panel';
import { ListaPanelComponent } from '../../../../shared/ui/lista-panel/lista-panel';
import { PaginacionPanelComponent } from '../../../../shared/ui/paginacion-panel/paginacion-panel';
import { PedidosClienteStore } from '../../estado/pedidos-cliente.store';
import { obtenerEtiquetaEstadoPedidoCliente } from '../../modelos/pedido-cliente.model';

@Component({
  selector: 'app-pagina-cliente-pedidos',
  imports: [
    CurrencyPipe,
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    BotonDirective,
    EstadoPantallaComponent,
    FilaPanelComponent,
    ListaPanelComponent,
    PaginacionPanelComponent,
  ],
  templateUrl: './pagina-cliente-pedidos.html',
  styleUrl: './pagina-cliente-pedidos.css',
})
export class PaginaClientePedidos implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly store = inject(PedidosClienteStore);
  readonly consultaActual = signal<ConsultaPedidosCliente>({ page: 0, size: 10 });
  readonly formularioFiltros = new FormGroup({
    q: new FormControl('', { nonNullable: true }),
    estado: new FormControl('', { nonNullable: true }),
    estadoPago: new FormControl('', { nonNullable: true }),
  });

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((parametros) => {
      const consulta = this.construirConsulta(parametros);
      this.consultaActual.set(consulta);
      this.formularioFiltros.patchValue(
        {
          q: consulta.q ?? '',
          estado: consulta.estado ?? '',
          estadoPago: consulta.estadoPago ?? '',
        },
        { emitEvent: false },
      );
      this.store.cargarListado(consulta);
    });
  }

  aplicarFiltros(): void {
    const filtros = this.formularioFiltros.getRawValue();
    this.actualizarUrl({
      page: 0,
      size: this.consultaActual().size ?? 10,
      q: filtros.q.trim() || undefined,
      estado: filtros.estado || undefined,
      estadoPago: (filtros.estadoPago || undefined) as ConsultaPedidosCliente['estadoPago'],
      sort: this.consultaActual().sort,
    });
  }

  limpiarFiltros(): void {
    this.actualizarUrl({ page: 0, size: 10 });
  }

  paginaAnterior(): void {
    const pagina = this.store.paginaActual();
    if (pagina > 0) this.actualizarUrl({ ...this.consultaActual(), page: pagina - 1 });
  }

  paginaSiguiente(): void {
    if (!this.store.ultimaPagina()) {
      this.actualizarUrl({ ...this.consultaActual(), page: this.store.paginaActual() + 1 });
    }
  }

  recargarPedidos(): void {
    this.store.cargarListado(this.consultaActual());
  }

  etiquetaEstado(estado: string): string {
    return obtenerEtiquetaEstadoPedidoCliente(estado);
  }

  private actualizarUrl(consulta: ConsultaPedidosCliente): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: consulta,
    });
  }

  private construirConsulta(parametros: ParamMap): ConsultaPedidosCliente {
    return {
      page: this.obtenerNumeroPagina(parametros.get('page')),
      size: this.obtenerNumeroTamanio(parametros.get('size')),
      q: parametros.get('q')?.trim() || undefined,
      estado: parametros.get('estado')?.trim() || undefined,
      estadoPago: this.obtenerEstadoPago(parametros.get('estadoPago')),
      sort: parametros.get('sort')?.trim() || undefined,
    };
  }

  private obtenerNumeroPagina(valor: string | null): number {
    const pagina = Number(valor);
    return Number.isInteger(pagina) && pagina >= 0 ? pagina : 0;
  }

  private obtenerNumeroTamanio(valor: string | null): number {
    const tamanio = Number(valor);
    return Number.isInteger(tamanio) && tamanio >= 1 && tamanio <= 50 ? tamanio : 10;
  }

  private obtenerEstadoPago(valor: string | null): ConsultaPedidosCliente['estadoPago'] {
    return valor === 'PAGADO' || valor === 'CON_SALDO' ? valor : undefined;
  }
}
