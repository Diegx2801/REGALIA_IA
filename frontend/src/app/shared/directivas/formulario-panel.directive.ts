import { booleanAttribute, Directive, input } from '@angular/core';

@Directive({
  selector: 'form[appFormularioPanel]',
  host: {
    class: 'rg-formulario-panel',
    '[class.rg-formulario-panel--una-columna]': 'unaColumna()',
    '[style.--rg-formulario-columnas]': 'columnas()',
  },
})
export class FormularioPanelDirective {
  readonly columnas = input('repeat(2, minmax(0, 1fr))', { alias: 'appFormularioColumnas' });
  readonly unaColumna = input(false, {
    alias: 'appFormularioUnaColumna',
    transform: booleanAttribute,
  });
}

@Directive({
  selector: 'label[appCampoFormulario]',
  host: {
    class: 'rg-campo-formulario',
  },
})
export class CampoFormularioDirective {}

@Directive({
  selector: 'small[appErrorCampo]',
  host: {
    class: 'rg-error-campo',
  },
})
export class ErrorCampoDirective {}
