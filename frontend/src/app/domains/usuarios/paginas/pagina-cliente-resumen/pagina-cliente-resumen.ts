import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgbProgressbar, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { BotonDirective } from '../../../../shared/directivas/boton.directive';
import { EstadoPantallaComponent } from '../../../../shared/ui/estado-pantalla/estado-pantalla';
import { TarjetaMetricaComponent } from '../../../../shared/ui/tarjeta-metrica/tarjeta-metrica';
import { ClientePanelStore } from '../../estado/cliente-panel.store';

@Component({
  selector: 'app-pagina-cliente-resumen',
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
  templateUrl: './pagina-cliente-resumen.html',
  styleUrl: './pagina-cliente-resumen.css',
})
export class PaginaClienteResumen implements OnInit {
  readonly store = inject(ClientePanelStore);

  readonly primerNombre = computed(() => {
    const nombreCompleto = this.store.perfil()?.nombreCompleto?.trim();
    return nombreCompleto ? nombreCompleto.split(' ')[0] : 'cliente';
  });

  readonly ultimoPedido = computed(() => this.store.pedidosRecientes()[0] ?? null);

  readonly porcentajePagado = computed(() => {
    const totalComprometido = this.store.totalPagado() + this.store.saldoPendiente();
    if (totalComprometido <= 0) return 0;

    // El porcentaje se calcula desde pedidos reales; no se inventan metas ni datos comerciales.
    return Math.round((this.store.totalPagado() / totalComprometido) * 100);
  });

  ngOnInit(): void {
    this.store.cargarPanel();
  }
}
