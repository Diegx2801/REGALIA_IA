import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { obtenerMensajeErrorUsuario } from '../../../core/http/modelos/error-api.model';
import {
  ConsultaPedidosCliente,
  PedidoClienteApiService,
} from '../acceso-datos/pedido-cliente-api.service';
import { PedidoCliente, PedidoClienteResumen } from '../modelos/pedido-cliente.model';

@Injectable()
export class PedidosClienteStore {
  private readonly pedidoApi = inject(PedidoClienteApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly pedidos = signal<PedidoClienteResumen[]>([]);
  readonly paginaActual = signal(0);
  readonly tamanioPagina = signal(10);
  readonly totalElementos = signal(0);
  readonly totalPaginas = signal(0);
  readonly ultimaPagina = signal(true);
  readonly cargando = signal(false);
  readonly mensajeError = signal<string | null>(null);

  readonly pedidoDetalle = signal<PedidoCliente | null>(null);
  readonly cargandoDetalle = signal(false);
  readonly mensajeErrorDetalle = signal<string | null>(null);

  cargarListado(consulta: ConsultaPedidosCliente): void {
    this.cargando.set(true);
    this.mensajeError.set(null);

    this.pedidoApi
      .obtenerMisPedidos(consulta)
      .pipe(
        finalize(() => this.cargando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (pagina) => {
          this.pedidos.set(pagina.contenido);
          this.paginaActual.set(pagina.paginaActual);
          this.tamanioPagina.set(pagina.tamanioPagina);
          this.totalElementos.set(pagina.totalElementos);
          this.totalPaginas.set(pagina.totalPaginas);
          this.ultimaPagina.set(pagina.ultimaPagina);
        },
        error: (error: unknown) => this.mensajeError.set(this.obtenerMensajeError(error)),
      });
  }

  cargarDetalle(idPedido: number): void {
    this.pedidoDetalle.set(null);
    this.cargandoDetalle.set(true);
    this.mensajeErrorDetalle.set(null);

    this.pedidoApi
      .obtenerMiPedidoPorId(idPedido)
      .pipe(
        finalize(() => this.cargandoDetalle.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (pedido) => this.pedidoDetalle.set(pedido),
        error: (error: unknown) => this.mensajeErrorDetalle.set(this.obtenerMensajeError(error)),
      });
  }

  private obtenerMensajeError(error: unknown): string {
    return obtenerMensajeErrorUsuario(error, 'No pudimos cargar tus pedidos.');
  }
}
