import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { BotonDirective } from '../../../../shared/directivas/boton.directive';
import { EstadoPantallaComponent } from '../../../../shared/ui/estado-pantalla/estado-pantalla';
import { FilaPanelComponent } from '../../../../shared/ui/fila-panel/fila-panel';
import { ListaPanelComponent } from '../../../../shared/ui/lista-panel/lista-panel';
import { VendedorPanelStore } from '../../estado/vendedor-panel.store';

@Component({
  selector: 'app-pagina-vendedor-pedidos',
  imports: [
    CurrencyPipe,
    NgbTooltip,
    BotonDirective,
    EstadoPantallaComponent,
    FilaPanelComponent,
    ListaPanelComponent,
  ],
  templateUrl: './pagina-vendedor-pedidos.html',
  styleUrl: './pagina-vendedor-pedidos.css',
})
export class PaginaVendedorPedidos implements OnInit {
  readonly store = inject(VendedorPanelStore);
  readonly estadoSeleccionado = signal('');
  readonly busqueda = signal('');

  readonly estadosDisponibles = computed(() =>
    Array.from(new Set(this.store.pedidos().map((pedido) => pedido.estadoPedido))).sort(),
  );

  readonly pedidosFiltrados = computed(() => {
    const estado = this.estadoSeleccionado();
    const busqueda = this.busqueda().trim().toLowerCase();

    // Filtro local sobre pedidos recibidos desde endpoints privados del vendedor.
    return this.store
      .pedidos()
      .filter((pedido) => !estado || pedido.estadoPedido === estado)
      .filter((pedido) => {
        if (!busqueda) return true;
        return (
          String(pedido.idPedido).includes(busqueda) ||
          pedido.nombreTienda.toLowerCase().includes(busqueda) ||
          pedido.correoCliente.toLowerCase().includes(busqueda)
        );
      });
  });

  ngOnInit(): void {
    this.store.cargarPanel();
  }

  filtrarPorTienda(evento: Event): void {
    const valor = (evento.target as HTMLSelectElement).value;
    this.estadoSeleccionado.set('');
    this.busqueda.set('');
    this.store.cargarPedidosPorTienda(valor ? Number(valor) : null);
  }

  filtrarPorEstado(evento: Event): void {
    this.estadoSeleccionado.set((evento.target as HTMLSelectElement).value);
  }

  buscar(evento: Event): void {
    this.busqueda.set((evento.target as HTMLInputElement).value);
  }
}
