import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { BotonDirective } from '../../../../shared/directivas/boton.directive';
import {
  CampoFormularioDirective,
  ErrorCampoDirective,
  FormularioPanelDirective,
} from '../../../../shared/directivas/formulario-panel.directive';
import { EstadoPantallaComponent } from '../../../../shared/ui/estado-pantalla/estado-pantalla';
import { FilaPanelComponent } from '../../../../shared/ui/fila-panel/fila-panel';
import { ListaPanelComponent } from '../../../../shared/ui/lista-panel/lista-panel';
import { VendedorPanelStore } from '../../estado/vendedor-panel.store';

@Component({
  selector: 'app-pagina-vendedor-tiendas',
  imports: [
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
  templateUrl: './pagina-vendedor-tiendas.html',
  styleUrl: './pagina-vendedor-tiendas.css',
})
export class PaginaVendedorTiendas implements OnInit {
  readonly store = inject(VendedorPanelStore);

  readonly formularioTienda = new FormGroup({
    nombre: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(150)],
    }),
    descripcion: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(1000)],
    }),
    direccionReferencia: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(255)],
    }),
    idRubro: new FormControl<number | null>(null, [Validators.required]),
  });

  ngOnInit(): void {
    this.store.cargarPanel();
    const idRubro = this.store.rubros()[0]?.idRubro ?? null;
    if (idRubro) this.formularioTienda.controls.idRubro.setValue(idRubro);
  }

  crearTienda(): void {
    this.store.limpiarMensajes();

    if (this.formularioTienda.invalid) {
      this.formularioTienda.markAllAsTouched();
      return;
    }

    const valor = this.formularioTienda.getRawValue();
    if (valor.idRubro === null) return;

    this.store.crearTienda({
      nombre: valor.nombre.trim(),
      descripcion: valor.descripcion.trim() || null,
      direccionReferencia: valor.direccionReferencia.trim() || null,
      idsRubros: [valor.idRubro],
    });

    this.formularioTienda.reset({
      nombre: '',
      descripcion: '',
      direccionReferencia: '',
      idRubro: this.store.rubros()[0]?.idRubro ?? null,
    });
  }

  campoTieneError(campo: keyof typeof this.formularioTienda.controls): boolean {
    const control = this.formularioTienda.controls[campo];
    return control.invalid && (control.touched || control.dirty);
  }
}
