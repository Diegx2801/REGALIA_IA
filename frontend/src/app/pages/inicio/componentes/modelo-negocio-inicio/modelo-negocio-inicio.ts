import { Component, input } from '@angular/core';
import { PasoModeloNegocio } from '../../modelos/inicio.model';

@Component({
  selector: 'app-modelo-negocio-inicio',
  templateUrl: './modelo-negocio-inicio.html',
})
export class ModeloNegocioInicio {
  readonly pasos = input.required<readonly PasoModeloNegocio[]>();
}
