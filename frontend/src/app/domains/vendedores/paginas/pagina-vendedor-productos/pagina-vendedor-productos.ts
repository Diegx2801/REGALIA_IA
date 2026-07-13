import { CurrencyPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { BotonDirective } from '../../../../shared/directivas/boton.directive';
import {
  CampoFormularioDirective,
  ErrorCampoDirective,
  FormularioPanelDirective,
} from '../../../../shared/directivas/formulario-panel.directive';
import { confirmarAccionCritica } from '../../../../shared/utilidades/confirmar-accion.util';
import { EstadoPantallaComponent } from '../../../../shared/ui/estado-pantalla/estado-pantalla';
import { FilaPanelComponent } from '../../../../shared/ui/fila-panel/fila-panel';
import { ListaPanelComponent } from '../../../../shared/ui/lista-panel/lista-panel';
import { VendedorPanelStore } from '../../estado/vendedor-panel.store';
import { ProductoVendedor } from '../../modelos/vendedor.model';

@Component({
  selector: 'app-pagina-vendedor-productos',
  imports: [
    CurrencyPipe,
    ReactiveFormsModule,
    NgbTooltip,
    BotonDirective,
    CampoFormularioDirective,
    ErrorCampoDirective,
    FormularioPanelDirective,
    EstadoPantallaComponent,
    FilaPanelComponent,
    ListaPanelComponent,
  ],
  templateUrl: './pagina-vendedor-productos.html',
  styleUrl: './pagina-vendedor-productos.css',
})
export class PaginaVendedorProductos implements OnInit {
  readonly store = inject(VendedorPanelStore);
  readonly idProductoEditando = signal<number | null>(null);

  readonly formularioProducto = new FormGroup({
    idTipoProducto: new FormControl<number | null>(null, [Validators.required]),
    nombre: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(150)],
    }),
    descripcion: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(1000)],
    }),
    precio: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0.01)],
    }),
    stock: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)],
    }),
    visibleEnTienda: new FormControl(true, { nonNullable: true }),
    urlImagen: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(500)],
    }),
  });

  ngOnInit(): void {
    this.store.cargarPanel();
    this.formularioProducto.controls.idTipoProducto.setValue(
      this.store.tiposProducto()[0]?.idTipoProducto ?? null,
    );
  }

  seleccionarTienda(evento: Event): void {
    const idTienda = Number((evento.target as HTMLSelectElement).value);
    if (idTienda) this.store.seleccionarTienda(idTienda);
  }

  guardarProducto(): void {
    this.store.limpiarMensajes();

    if (this.formularioProducto.invalid) {
      this.formularioProducto.markAllAsTouched();
      return;
    }

    const idTienda = this.store.idTiendaSeleccionada();
    const valor = this.formularioProducto.getRawValue();
    if (idTienda === null || valor.idTipoProducto === null) return;

    this.store.guardarProducto(
      idTienda,
      {
        idTipoProducto: valor.idTipoProducto,
        nombre: valor.nombre.trim(),
        descripcion: valor.descripcion.trim() || null,
        precio: Number(valor.precio),
        stock: Number(valor.stock),
        visibleEnTienda: valor.visibleEnTienda,
        urlImagen: valor.urlImagen.trim() || null,
      },
      this.idProductoEditando() ?? undefined,
    );
    this.cancelarEdicionProducto();
  }

  editarProducto(producto: ProductoVendedor): void {
    const tipoProducto = this.store
      .tiposProducto()
      .find((tipo) => tipo.nombre === producto.tipoProducto);

    this.idProductoEditando.set(producto.idProducto);
    this.formularioProducto.reset({
      idTipoProducto: tipoProducto?.idTipoProducto ?? this.store.tiposProducto()[0]?.idTipoProducto ?? null,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: producto.precio,
      stock: producto.stock,
      visibleEnTienda: producto.visibleEnTienda,
      urlImagen: producto.urlImagen.includes('producto-fallback.svg') ? '' : producto.urlImagen,
    });
  }

  cancelarEdicionProducto(): void {
    this.idProductoEditando.set(null);
    this.formularioProducto.reset({
      idTipoProducto: this.store.tiposProducto()[0]?.idTipoProducto ?? null,
      nombre: '',
      descripcion: '',
      precio: 0,
      stock: 0,
      visibleEnTienda: true,
      urlImagen: '',
    });
  }

  desactivarProducto(producto: ProductoVendedor): void {
    const idTienda = this.store.idTiendaSeleccionada();
    if (idTienda === null) return;

    if (!confirmarAccionCritica(`Vas a desactivar el producto "${producto.nombre}".`)) return;

    this.store.desactivarProducto(idTienda, producto.idProducto);
    if (this.idProductoEditando() === producto.idProducto) this.cancelarEdicionProducto();
  }

  campoTieneError(campo: keyof typeof this.formularioProducto.controls): boolean {
    const control = this.formularioProducto.controls[campo];
    return control.invalid && (control.touched || control.dirty);
  }
}
