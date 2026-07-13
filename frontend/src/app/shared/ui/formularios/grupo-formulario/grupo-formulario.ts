import { Component, input } from '@angular/core';

@Component({
  selector: 'app-grupo-formulario',
  templateUrl: './grupo-formulario.html',
  styleUrl: '../formulario-compartido.css',
})
export class GrupoFormulario {
  readonly columnas = input<1 | 2 | 3 | 4>(1);
}
