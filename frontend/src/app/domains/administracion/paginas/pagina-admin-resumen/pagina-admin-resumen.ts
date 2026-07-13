import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgbProgressbar, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { BotonDirective } from '../../../../shared/directivas/boton.directive';
import { EstadoPantallaComponent } from '../../../../shared/ui/estado-pantalla/estado-pantalla';
import { TarjetaMetricaComponent } from '../../../../shared/ui/tarjeta-metrica/tarjeta-metrica';
import { AdministracionPanelStore } from '../../estado/administracion-panel.store';
import { TiendaAdministracion } from '../../modelos/panel-administracion.model';

@Component({
  selector: 'app-pagina-admin-resumen',
  imports: [
    CurrencyPipe,
    DatePipe,
    RouterLink,
    NgbProgressbar,
    NgbTooltip,
    BotonDirective,
    EstadoPantallaComponent,
    TarjetaMetricaComponent,
  ],
  templateUrl: './pagina-admin-resumen.html',
  styleUrl: './pagina-admin-resumen.css',
})
export class PaginaAdminResumen implements OnInit {
  readonly store = inject(AdministracionPanelStore);

  readonly tiendasPrioritarias = computed(() =>
    [...this.store.tiendas()].sort((a, b) => {
      const prioridad = { PENDIENTE: 0, OBSERVADA: 1, APROBADA: 2, RECHAZADA: 3 } as Record<string, number>;
      return (prioridad[a.estadoRevision] ?? 4) - (prioridad[b.estadoRevision] ?? 4);
    }),
  );

  readonly pedidosPrioritarios = computed(() =>
    [...this.store.pedidos()].sort((a, b) => b.saldoPendiente - a.saldoPendiente),
  );

  readonly porcentajeTiendasPendientes = computed(() => {
    const total = this.store.totalTiendas();
    if (total <= 0) return 0;

    // Indicador ejecutivo calculado solo con datos reales devueltos por el backend.
    return Math.round((this.store.tiendasPendientes() / total) * 100);
  });

  readonly porcentajePedidosConSaldo = computed(() => {
    const total = this.store.totalPedidos();
    if (total <= 0) return 0;
    return Math.round((this.store.pedidosConSaldo() / total) * 100);
  });

  ngOnInit(): void {
    this.store.cargarResumen();
  }

  aprobar(tienda: TiendaAdministracion): void {
    this.store.cambiarEstadoTienda(tienda, 'aprobar');
  }

  observar(tienda: TiendaAdministracion): void {
    this.store.cambiarEstadoTienda(tienda, 'observar');
  }

  rechazar(tienda: TiendaAdministracion): void {
    this.store.cambiarEstadoTienda(tienda, 'rechazar');
  }
}
