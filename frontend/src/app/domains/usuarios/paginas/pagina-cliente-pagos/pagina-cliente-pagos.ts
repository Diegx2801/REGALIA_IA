import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BotonDirective } from '../../../../shared/directivas/boton.directive';
import {
  CampoFormularioDirective,
  ErrorCampoDirective,
  FormularioPanelDirective,
} from '../../../../shared/directivas/formulario-panel.directive';
import { EstadoPantallaComponent } from '../../../../shared/ui/estado-pantalla/estado-pantalla';
import { FilaPanelComponent } from '../../../../shared/ui/fila-panel/fila-panel';
import { ListaPanelComponent } from '../../../../shared/ui/lista-panel/lista-panel';
import { ClientePanelStore } from '../../estado/cliente-panel.store';

@Component({
  selector: 'app-pagina-cliente-pagos',
  imports: [
    CurrencyPipe,
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    BotonDirective,
    CampoFormularioDirective,
    ErrorCampoDirective,
    FormularioPanelDirective,
    EstadoPantallaComponent,
    FilaPanelComponent,
    ListaPanelComponent,
  ],
  templateUrl: './pagina-cliente-pagos.html',
  styleUrl: './pagina-cliente-pagos.css',
})
export class PaginaClientePagos implements OnInit {
  readonly store = inject(ClientePanelStore);
  readonly idPedidoSeleccionado = signal<number | null>(null);

  readonly pedidoSeleccionado = computed(() => {
    const idPedido = this.idPedidoSeleccionado();
    return this.store.pedidosPendientesPago().find((pedido) => pedido.idPedido === idPedido) ?? null;
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

  ngOnInit(): void {
    this.store.cargarPanel();
  }

  seleccionarPedido(idPedido: number): void {
    this.idPedidoSeleccionado.set(idPedido);
    this.store.seleccionarPedido(idPedido);
    this.formularioPago.reset({
      metodoPagoPasarela: 'MERCADO_PAGO',
      codigoTransaccion: '',
    });
  }

  registrarPago(): void {
    const pedido = this.pedidoSeleccionado();
    this.store.limpiarMensajes();

    if (!pedido) return;

    if (this.formularioPago.invalid) {
      this.formularioPago.markAllAsTouched();
      return;
    }

    const valor = this.formularioPago.getRawValue();
    this.store.registrarPagoRestante(
      pedido.idPedido,
      valor.metodoPagoPasarela.trim(),
      valor.codigoTransaccion.trim(),
    );
    this.formularioPago.reset({
      metodoPagoPasarela: 'MERCADO_PAGO',
      codigoTransaccion: '',
    });
  }

  campoTieneError(campo: keyof typeof this.formularioPago.controls): boolean {
    const control = this.formularioPago.controls[campo];
    return control.invalid && (control.touched || control.dirty);
  }
}
