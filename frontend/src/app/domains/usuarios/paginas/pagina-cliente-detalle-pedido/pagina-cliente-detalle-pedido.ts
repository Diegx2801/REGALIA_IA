import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BotonDirective } from '../../../../shared/directivas/boton.directive';
import { EstadoPantallaComponent } from '../../../../shared/ui/estado-pantalla/estado-pantalla';
import { FilaPanelComponent } from '../../../../shared/ui/fila-panel/fila-panel';
import { ListaPanelComponent } from '../../../../shared/ui/lista-panel/lista-panel';
import { PedidosClienteStore } from '../../estado/pedidos-cliente.store';
import { obtenerEtiquetaEstadoPedidoCliente } from '../../modelos/pedido-cliente.model';

@Component({
  selector: 'app-pagina-cliente-detalle-pedido',
  imports: [
    CurrencyPipe,
    DatePipe,
    RouterLink,
    BotonDirective,
    EstadoPantallaComponent,
    FilaPanelComponent,
    ListaPanelComponent,
  ],
  templateUrl: './pagina-cliente-detalle-pedido.html',
  styleUrl: './pagina-cliente-detalle-pedido.css',
})
export class PaginaClienteDetallePedido implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly store = inject(PedidosClienteStore);

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((parametros) => {
      const idPedido = Number(parametros.get('idPedido'));

      if (!Number.isInteger(idPedido) || idPedido <= 0) {
        void this.router.navigate(['/cliente/pedidos']);
        return;
      }

      this.store.cargarDetalle(idPedido);
    });
  }

  recargarDetalle(): void {
    const idPedido = this.store.pedidoDetalle()?.idPedido ?? Number(this.route.snapshot.paramMap.get('idPedido'));
    if (Number.isInteger(idPedido) && idPedido > 0) this.store.cargarDetalle(idPedido);
  }

  etiquetaEstado(estado: string): string {
    return obtenerEtiquetaEstadoPedidoCliente(estado);
  }
}
