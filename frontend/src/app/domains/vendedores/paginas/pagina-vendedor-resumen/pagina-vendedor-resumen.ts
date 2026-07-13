import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgbProgressbar, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { BotonDirective } from '../../../../shared/directivas/boton.directive';
import { EstadoPantallaComponent } from '../../../../shared/ui/estado-pantalla/estado-pantalla';
import { TarjetaMetricaComponent } from '../../../../shared/ui/tarjeta-metrica/tarjeta-metrica';
import { VendedorPanelStore } from '../../estado/vendedor-panel.store';

@Component({
  selector: 'app-pagina-vendedor-resumen',
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
  templateUrl: './pagina-vendedor-resumen.html',
  styleUrl: './pagina-vendedor-resumen.css',
})
export class PaginaVendedorResumen implements OnInit {
  readonly store = inject(VendedorPanelStore);

  readonly nombreOperador = computed(() => {
    const nombreCompleto = this.store.perfil()?.nombreCompleto?.trim();
    return nombreCompleto ? nombreCompleto.split(' ')[0] : 'vendedor';
  });

  readonly tiendaPrincipal = computed(() => this.store.tiendas()[0] ?? null);

  readonly stockDisponible = computed(() =>
    this.store.productos().reduce((total, producto) => total + Math.max(producto.stock, 0), 0),
  );

  readonly porcentajeCobrado = computed(() => {
    const totalGestionado = this.store.totalPagado() + this.store.saldoPendiente();
    if (totalGestionado <= 0) return 0;

    // Se calcula con pedidos reales recibidos; no representa una meta comercial inventada.
    return Math.round((this.store.totalPagado() / totalGestionado) * 100);
  });

  ngOnInit(): void {
    this.store.cargarPanel();
  }
}
