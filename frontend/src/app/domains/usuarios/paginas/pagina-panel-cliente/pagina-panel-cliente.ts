import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';
import { BotonDirective } from '../../../../shared/directivas/boton.directive';
import {
  CampoFormularioDirective,
  ErrorCampoDirective,
  FormularioPanelDirective,
} from '../../../../shared/directivas/formulario-panel.directive';
import { PedidoClienteApiService } from '../../acceso-datos/pedido-cliente-api.service';
import { UsuarioApiService } from '../../acceso-datos/usuario-api.service';
import { PedidoCliente } from '../../modelos/pedido-cliente.model';
import { UsuarioPerfil } from '../../modelos/usuario.model';
import { EstadoPantallaComponent } from '../../../../shared/ui/estado-pantalla/estado-pantalla';
import { FilaPanelComponent } from '../../../../shared/ui/fila-panel/fila-panel';
import { ListaPanelComponent } from '../../../../shared/ui/lista-panel/lista-panel';
import { TarjetaMetricaComponent } from '../../../../shared/ui/tarjeta-metrica/tarjeta-metrica';

@Component({
  selector: 'app-pagina-panel-cliente',
  imports: [
    CurrencyPipe,
    DatePipe,
    ReactiveFormsModule,
    BotonDirective,
    CampoFormularioDirective,
    ErrorCampoDirective,
    FormularioPanelDirective,
    EstadoPantallaComponent,
    FilaPanelComponent,
    ListaPanelComponent,
    TarjetaMetricaComponent,
  ],
  templateUrl: './pagina-panel-cliente.html',
  styleUrl: './pagina-panel-cliente.css',
})
export class PaginaPanelCliente implements OnInit {
  private readonly usuarioApi = inject(UsuarioApiService);
  private readonly pedidoApi = inject(PedidoClienteApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly perfil = signal<UsuarioPerfil | null>(null);
  readonly pedidos = signal<PedidoCliente[]>([]);
  readonly pedidoDetalle = signal<PedidoCliente | null>(null);
  readonly cargando = signal(true);
  readonly guardandoPerfil = signal(false);
  readonly cargandoDetallePedido = signal(false);
  readonly registrandoPago = signal(false);
  readonly mensajeError = signal<string | null>(null);
  readonly mensajeExito = signal<string | null>(null);

  readonly formularioPerfil = new FormGroup({
    nombres: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    }),
    apellidos: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    }),
    telefono: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(20)],
    }),
  });

  readonly formularioPago = new FormGroup({
    metodoPagoPasarela: new FormControl('MERCADO_PAGO', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(50)],
    }),
    codigoTransaccion: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    }),
  });

  readonly pedidosActivos = computed(
    () => this.pedidos().filter((pedido) => pedido.estadoPedido !== 'ENTREGADO').length,
  );
  readonly saldoPendiente = computed(() =>
    this.pedidos().reduce((total, pedido) => total + pedido.saldoPendiente, 0),
  );
  readonly totalInvertido = computed(() =>
    this.pedidos().reduce((total, pedido) => total + pedido.montoPagado, 0),
  );
  readonly pedidosRecientes = computed(() => this.pedidos().slice(0, 8));
  readonly puedeRegistrarPago = computed(() => (this.pedidoDetalle()?.saldoPendiente ?? 0) > 0);

  ngOnInit(): void {
    this.cargarPanel();
  }

  cargarPanel(): void {
    this.cargando.set(true);
    this.mensajeError.set(null);
    this.mensajeExito.set(null);
    this.pedidoDetalle.set(null);

    forkJoin({
      perfil: this.usuarioApi.obtenerPerfilActual(),
      pedidos: this.pedidoApi.obtenerMisPedidos(),
    })
      .pipe(
        finalize(() => this.cargando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ perfil, pedidos }) => {
          this.perfil.set(perfil);
          this.pedidos.set(pedidos);
          this.formularioPerfil.reset({
            nombres: perfil.nombres,
            apellidos: perfil.apellidos,
            telefono: perfil.telefono === 'Telefono pendiente' ? '' : perfil.telefono,
          });
        },
        error: (error: Error) => this.mensajeError.set(this.obtenerMensajeError(error)),
      });
  }

  guardarPerfil(): void {
    this.mensajeError.set(null);
    this.mensajeExito.set(null);

    if (this.formularioPerfil.invalid) {
      this.formularioPerfil.markAllAsTouched();
      return;
    }

    const valor = this.formularioPerfil.getRawValue();
    this.guardandoPerfil.set(true);

    // El correo no se envia: el backend identifica al cliente por el JWT autenticado.
    this.usuarioApi
      .actualizarPerfil({
        nombres: valor.nombres.trim(),
        apellidos: valor.apellidos.trim(),
        telefono: valor.telefono.trim() || null,
      })
      .pipe(
        finalize(() => this.guardandoPerfil.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (perfil) => {
          this.perfil.set(perfil);
          this.mensajeExito.set('Perfil actualizado correctamente.');
        },
        error: (error: Error) => this.mensajeError.set(this.obtenerMensajeError(error)),
      });
  }

  verDetallePedido(pedido: PedidoCliente): void {
    this.pedidoDetalle.set(null);
    this.cargandoDetallePedido.set(true);
    this.mensajeError.set(null);
    this.formularioPago.reset({
      metodoPagoPasarela: 'MERCADO_PAGO',
      codigoTransaccion: '',
    });

    this.pedidoApi
      .obtenerMiPedidoPorId(pedido.idPedido)
      .pipe(
        finalize(() => this.cargandoDetallePedido.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (detalle) => this.pedidoDetalle.set(detalle),
        error: (error: Error) => this.mensajeError.set(this.obtenerMensajeError(error)),
      });
  }

  registrarPagoRestante(): void {
    const pedido = this.pedidoDetalle();
    this.mensajeError.set(null);
    this.mensajeExito.set(null);

    if (!pedido || !this.puedeRegistrarPago()) return;

    if (this.formularioPago.invalid) {
      this.formularioPago.markAllAsTouched();
      return;
    }

    const valor = this.formularioPago.getRawValue();
    this.registrandoPago.set(true);

    // El backend registra este pago como RESTANTE; el frontend solo envia datos de pasarela.
    this.pedidoApi
      .registrarPagoRestante(pedido.idPedido, {
        metodoPagoPasarela: valor.metodoPagoPasarela.trim(),
        codigoTransaccion: valor.codigoTransaccion.trim(),
      })
      .pipe(
        finalize(() => this.registrandoPago.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (pedidoActualizado) => {
          this.pedidoDetalle.set(pedidoActualizado);
          this.pedidos.update((pedidos) =>
            pedidos.map((item) =>
              item.idPedido === pedidoActualizado.idPedido ? pedidoActualizado : item,
            ),
          );
          this.formularioPago.reset({
            metodoPagoPasarela: 'MERCADO_PAGO',
            codigoTransaccion: '',
          });
          this.mensajeExito.set('Pago registrado correctamente.');
        },
        error: (error: Error) => this.mensajeError.set(this.obtenerMensajeError(error)),
      });
  }

  campoPerfilTieneError(campo: keyof typeof this.formularioPerfil.controls): boolean {
    const control = this.formularioPerfil.controls[campo];
    return control.invalid && (control.touched || control.dirty);
  }

  campoPagoTieneError(campo: keyof typeof this.formularioPago.controls): boolean {
    const control = this.formularioPago.controls[campo];
    return control.invalid && (control.touched || control.dirty);
  }

  private obtenerMensajeError(error: Error): string {
    const mensaje = error.message ?? '';
    const esErrorTecnico =
      mensaje.includes('Http failure response') ||
      mensaje.includes('Unknown Error') ||
      mensaje.includes('Timeout');

    return esErrorTecnico
      ? 'No pudimos conectar con el backend para cargar tu panel cliente.'
      : mensaje || 'No pudimos cargar la informacion del cliente.';
  }
}
