import { CurrencyPipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { ConsultaPedidosVendedor } from '../../acceso-datos/vendedor-api.service';
import { BotonDirective } from '../../../../shared/directivas/boton.directive';
import { EstadoPantallaComponent } from '../../../../shared/ui/estado-pantalla/estado-pantalla';
import { FilaPanelComponent } from '../../../../shared/ui/fila-panel/fila-panel';
import { ListaPanelComponent } from '../../../../shared/ui/lista-panel/lista-panel';
import { PaginacionPanelComponent } from '../../../../shared/ui/paginacion-panel/paginacion-panel';
import { VendedorPanelStore } from '../../estado/vendedor-panel.store';

@Component({
  selector: 'app-pagina-vendedor-pedidos',
  imports: [
    CurrencyPipe,
    ReactiveFormsModule,
    NgbTooltip,
    BotonDirective,
    EstadoPantallaComponent,
    FilaPanelComponent,
    ListaPanelComponent,
    PaginacionPanelComponent,
  ],
  templateUrl: './pagina-vendedor-pedidos.html',
  styleUrl: './pagina-vendedor-pedidos.css',
})
export class PaginaVendedorPedidos implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly store = inject(VendedorPanelStore);
  readonly consultaActual = signal<ConsultaPedidosVendedor>({ page: 0, size: 10 });
  readonly formularioFiltros = new FormGroup({
    idTienda: new FormControl('', { nonNullable: true }),
    q: new FormControl('', { nonNullable: true }),
    estado: new FormControl('', { nonNullable: true }),
    estadoPago: new FormControl('', { nonNullable: true }),
  });

  ngOnInit(): void {
    // El contexto comercial solo se carga una vez; los pedidos se consultan por URL y pagina.
    this.store.cargarPanel(false, false);

    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((parametros) => {
      const consulta = this.construirConsulta(parametros);
      this.consultaActual.set(consulta);
      this.formularioFiltros.patchValue(
        {
          idTienda: consulta.idTienda?.toString() ?? '',
          q: consulta.q ?? '',
          estado: consulta.estado ?? '',
          estadoPago: consulta.estadoPago ?? '',
        },
        { emitEvent: false },
      );
      this.store.cargarPedidosPaginados(consulta);
    });
  }

  aplicarFiltros(): void {
    const filtros = this.formularioFiltros.getRawValue();
    this.actualizarUrl({
      page: 0,
      size: this.consultaActual().size ?? 10,
      idTienda: this.obtenerNumeroPositivo(filtros.idTienda),
      q: filtros.q.trim() || undefined,
      estado: filtros.estado || undefined,
      estadoPago: (filtros.estadoPago || undefined) as ConsultaPedidosVendedor['estadoPago'],
      sort: this.consultaActual().sort,
    });
  }

  limpiarFiltros(): void {
    this.actualizarUrl({ page: 0, size: 10 });
  }

  paginaAnterior(): void {
    if (this.store.paginaPedidosActual() > 0) {
      this.actualizarUrl({ ...this.consultaActual(), page: this.store.paginaPedidosActual() - 1 });
    }
  }

  paginaSiguiente(): void {
    if (!this.store.ultimaPaginaPedidos()) {
      this.actualizarUrl({ ...this.consultaActual(), page: this.store.paginaPedidosActual() + 1 });
    }
  }

  recargarPedidos(): void {
    this.store.cargarPedidosPaginados(this.consultaActual());
  }

  private actualizarUrl(consulta: ConsultaPedidosVendedor): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: consulta,
    });
  }

  private construirConsulta(parametros: ParamMap): ConsultaPedidosVendedor {
    return {
      page: this.obtenerPagina(parametros.get('page')),
      size: this.obtenerTamanio(parametros.get('size')),
      idTienda: this.obtenerNumeroPositivo(parametros.get('idTienda')),
      q: parametros.get('q')?.trim() || undefined,
      estado: parametros.get('estado')?.trim() || undefined,
      estadoPago: this.obtenerEstadoPago(parametros.get('estadoPago')),
      sort: parametros.get('sort')?.trim() || undefined,
    };
  }

  private obtenerPagina(valor: string | null): number {
    const pagina = Number(valor);
    return Number.isInteger(pagina) && pagina >= 0 ? pagina : 0;
  }

  private obtenerTamanio(valor: string | null): number {
    const tamanio = Number(valor);
    return Number.isInteger(tamanio) && tamanio >= 1 && tamanio <= 50 ? tamanio : 10;
  }

  private obtenerNumeroPositivo(valor: string | null): number | undefined {
    const numero = Number(valor);
    return Number.isInteger(numero) && numero > 0 ? numero : undefined;
  }

  private obtenerEstadoPago(valor: string | null): ConsultaPedidosVendedor['estadoPago'] {
    return valor === 'PAGADO' || valor === 'CON_SALDO' ? valor : undefined;
  }
}
