import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BotonDirective } from '../../../../shared/directivas/boton.directive';
import { EstadoPantallaComponent } from '../../../../shared/ui/estado-pantalla/estado-pantalla';
import { FilaPanelComponent } from '../../../../shared/ui/fila-panel/fila-panel';
import { ListaPanelComponent } from '../../../../shared/ui/lista-panel/lista-panel';
import { ClientePanelStore } from '../../estado/cliente-panel.store';

@Component({
  selector: 'app-pagina-cliente-pedidos',
  imports: [
    CurrencyPipe,
    DatePipe,
    RouterLink,
    BotonDirective,
    EstadoPantallaComponent,
    FilaPanelComponent,
    ListaPanelComponent,
  ],
  templateUrl: './pagina-cliente-pedidos.html',
  styleUrl: './pagina-cliente-pedidos.css',
})
export class PaginaClientePedidos implements OnInit {
  readonly store = inject(ClientePanelStore);
  readonly busqueda = signal('');
  readonly estadoSeleccionado = signal('');

  readonly estadosDisponibles = computed(() =>
    Array.from(new Set(this.store.pedidos().map((pedido) => pedido.estadoPedido))).sort(),
  );

  readonly pedidosFiltrados = computed(() => {
    const busqueda = this.busqueda().trim().toLowerCase();
    const estado = this.estadoSeleccionado();

    // Se filtran pedidos reales ya obtenidos del backend; no hay informacion simulada.
    return this.store
      .pedidos()
      .filter((pedido) => !estado || pedido.estadoPedido === estado)
      .filter((pedido) => {
        if (!busqueda) return true;
        return (
          String(pedido.idPedido).includes(busqueda) ||
          pedido.nombreTienda.toLowerCase().includes(busqueda) ||
          pedido.estadoPedido.toLowerCase().includes(busqueda)
        );
      });
  });

  ngOnInit(): void {
    this.store.cargarPanel();
  }

  actualizarBusqueda(evento: Event): void {
    this.busqueda.set((evento.target as HTMLInputElement).value);
  }

  actualizarEstado(evento: Event): void {
    this.estadoSeleccionado.set((evento.target as HTMLSelectElement).value);
  }
}
