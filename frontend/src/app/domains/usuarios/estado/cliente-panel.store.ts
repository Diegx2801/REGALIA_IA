import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, forkJoin } from 'rxjs';
import { obtenerMensajeErrorUsuario } from '../../../core/http/modelos/error-api.model';
import { CuentaIdentidadApiService } from '../../autenticacion/acceso-datos/cuenta-identidad-api.service';
import { IdentidadCuenta } from '../../autenticacion/modelos/autenticacion.model';
import { PedidoClienteApiService } from '../acceso-datos/pedido-cliente-api.service';
import { UsuarioApiService } from '../acceso-datos/usuario-api.service';
import { PedidoCliente } from '../modelos/pedido-cliente.model';
import { SolicitudActualizarPerfilUsuario, UsuarioPerfil } from '../modelos/usuario.model';

@Injectable({ providedIn: 'root' })
export class ClientePanelStore {
  private readonly usuarioApi = inject(UsuarioApiService);
  private readonly pedidoApi = inject(PedidoClienteApiService);
  private readonly cuentaIdentidadApi = inject(CuentaIdentidadApiService);
  private readonly destroyRef = inject(DestroyRef);
  private panelCargado = false;

  readonly perfil = signal<UsuarioPerfil | null>(null);
  readonly pedidos = signal<PedidoCliente[]>([]);
  readonly pedidoDetalle = signal<PedidoCliente | null>(null);
  readonly identidadesCuenta = signal<IdentidadCuenta[]>([]);
  readonly cargando = signal(false);
  readonly cargandoDetalle = signal(false);
  readonly guardandoPerfil = signal(false);
  readonly registrandoPago = signal(false);
  readonly vinculandoGoogle = signal(false);
  readonly mensajeError = signal<string | null>(null);
  readonly mensajeExito = signal<string | null>(null);

  readonly pedidosActivos = computed(
    () => this.pedidos().filter((pedido) => pedido.estadoPedido !== 'ENTREGADO').length,
  );
  readonly pedidosPendientesPago = computed(() =>
    this.pedidos().filter((pedido) => pedido.saldoPendiente > 0),
  );
  readonly pedidosPagados = computed(() =>
    this.pedidos().filter((pedido) => pedido.saldoPendiente <= 0),
  );
  readonly saldoPendiente = computed(() =>
    this.pedidos().reduce((total, pedido) => total + pedido.saldoPendiente, 0),
  );
  readonly totalPagado = computed(() =>
    this.pedidos().reduce((total, pedido) => total + pedido.montoPagado, 0),
  );
  readonly pedidosRecientes = computed(() => this.pedidos().slice(0, 5));
  readonly identidadGoogle = computed(
    () => this.identidadesCuenta().find((identidad) => identidad.proveedor === 'GOOGLE') ?? null,
  );
  readonly googleVinculado = computed(() => Boolean(this.identidadGoogle()?.vinculada));

  cargarPanel(forzar = false): void {
    if (this.panelCargado && !forzar) return;

    this.cargando.set(true);
    this.mensajeError.set(null);
    this.mensajeExito.set(null);

    forkJoin({
      perfil: this.usuarioApi.obtenerPerfilActual(),
      pedidos: this.pedidoApi.obtenerMisPedidos(),
      identidades: this.cuentaIdentidadApi.listarIdentidades(),
    })
      .pipe(
        finalize(() => this.cargando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ perfil, pedidos, identidades }) => {
          this.perfil.set(perfil);
          this.pedidos.set(pedidos);
          this.identidadesCuenta.set(identidades);
          this.panelCargado = true;
        },
        error: (error: unknown) => this.mensajeError.set(this.obtenerMensajeError(error)),
      });
  }

  refrescarPedidos(): void {
    this.pedidoApi
      .obtenerMisPedidos()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (pedidos) => this.pedidos.set(pedidos),
        error: (error: unknown) => this.mensajeError.set(this.obtenerMensajeError(error)),
      });
  }

  guardarPerfil(solicitud: SolicitudActualizarPerfilUsuario): void {
    this.guardandoPerfil.set(true);
    this.mensajeError.set(null);
    this.mensajeExito.set(null);

    // El backend identifica al cliente por el JWT; no se envia idUsuario desde el frontend.
    this.usuarioApi
      .actualizarPerfil(solicitud)
      .pipe(
        finalize(() => this.guardandoPerfil.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (perfil) => {
          this.perfil.set(perfil);
          this.mensajeExito.set('Perfil actualizado correctamente.');
        },
        error: (error: unknown) => this.mensajeError.set(this.obtenerMensajeError(error)),
      });
  }

  seleccionarPedido(idPedido: number): void {
    this.pedidoDetalle.set(null);
    this.cargandoDetalle.set(true);
    this.mensajeError.set(null);

    this.pedidoApi
      .obtenerMiPedidoPorId(idPedido)
      .pipe(
        finalize(() => this.cargandoDetalle.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (pedido) => this.pedidoDetalle.set(pedido),
        error: (error: unknown) => this.mensajeError.set(this.obtenerMensajeError(error)),
      });
  }

  registrarPagoRestante(idPedido: number, metodoPagoPasarela: string, codigoTransaccion: string): void {
    this.registrandoPago.set(true);
    this.mensajeError.set(null);
    this.mensajeExito.set(null);

    // El endpoint registra el pago como saldo restante del pedido autenticado.
    this.pedidoApi
      .registrarPagoRestante(idPedido, { metodoPagoPasarela, codigoTransaccion })
      .pipe(
        finalize(() => this.registrandoPago.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (pedidoActualizado) => {
          this.pedidoDetalle.set(pedidoActualizado);
          this.pedidos.update((pedidos) =>
            pedidos.map((pedido) =>
              pedido.idPedido === pedidoActualizado.idPedido ? pedidoActualizado : pedido,
            ),
          );
          this.mensajeExito.set('Pago registrado correctamente.');
        },
        error: (error: unknown) => this.mensajeError.set(this.obtenerMensajeError(error)),
      });
  }

  vincularGoogle(idToken: string): void {
    this.vinculandoGoogle.set(true);
    this.mensajeError.set(null);
    this.mensajeExito.set(null);

    this.cuentaIdentidadApi
      .vincularGoogle(idToken)
      .pipe(
        finalize(() => this.vinculandoGoogle.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (identidad) => {
          this.identidadesCuenta.update((identidades) => [
            identidad,
            ...identidades.filter((actual) => actual.proveedor !== identidad.proveedor),
          ]);
          this.mensajeExito.set('Google vinculado correctamente.');
        },
        error: (error: unknown) => this.mensajeError.set(this.obtenerMensajeError(error)),
      });
  }

  registrarErrorCuenta(mensaje: string): void {
    this.mensajeError.set(mensaje);
    this.mensajeExito.set(null);
  }

  limpiarMensajes(): void {
    this.mensajeError.set(null);
    this.mensajeExito.set(null);
  }

  private obtenerMensajeError(error: unknown): string {
    return obtenerMensajeErrorUsuario(error, 'No pudimos cargar la informacion del cliente.');
  }
}
