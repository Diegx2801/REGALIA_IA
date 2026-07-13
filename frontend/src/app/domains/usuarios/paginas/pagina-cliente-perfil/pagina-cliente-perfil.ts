import { Component, effect, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BotonDirective } from '../../../../shared/directivas/boton.directive';
import {
  CampoFormularioDirective,
  ErrorCampoDirective,
  FormularioPanelDirective,
} from '../../../../shared/directivas/formulario-panel.directive';
import { EstadoPantallaComponent } from '../../../../shared/ui/estado-pantalla/estado-pantalla';
import { ClientePanelStore } from '../../estado/cliente-panel.store';

@Component({
  selector: 'app-pagina-cliente-perfil',
  imports: [
    ReactiveFormsModule,
    BotonDirective,
    CampoFormularioDirective,
    ErrorCampoDirective,
    FormularioPanelDirective,
    EstadoPantallaComponent,
  ],
  templateUrl: './pagina-cliente-perfil.html',
  styleUrl: './pagina-cliente-perfil.css',
})
export class PaginaClientePerfil implements OnInit {
  readonly store = inject(ClientePanelStore);

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

  constructor() {
    effect(() => {
      const perfil = this.store.perfil();
      if (!perfil) return;

      this.formularioPerfil.patchValue(
        {
          nombres: perfil.nombres,
          apellidos: perfil.apellidos,
          telefono: perfil.telefono === 'Telefono pendiente' ? '' : perfil.telefono,
        },
        { emitEvent: false },
      );
    });
  }

  ngOnInit(): void {
    this.store.cargarPanel();
  }

  guardarPerfil(): void {
    this.store.limpiarMensajes();

    if (this.formularioPerfil.invalid) {
      this.formularioPerfil.markAllAsTouched();
      return;
    }

    const valor = this.formularioPerfil.getRawValue();
    this.store.guardarPerfil({
      nombres: valor.nombres.trim(),
      apellidos: valor.apellidos.trim(),
      telefono: valor.telefono.trim() || null,
    });
  }

  campoTieneError(campo: keyof typeof this.formularioPerfil.controls): boolean {
    const control = this.formularioPerfil.controls[campo];
    return control.invalid && (control.touched || control.dirty);
  }
}
