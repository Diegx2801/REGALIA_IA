import { booleanAttribute, Directive, input } from '@angular/core';

export type VarianteBoton = 'primario' | 'secundario' | 'peligro' | 'fantasma';
export type TamanoBoton = 'sm' | 'md' | 'lg';

@Directive({
  selector: 'button[appBoton], a[appBoton]',
  host: {
    class: 'rg-boton',
    '[class.rg-boton--primario]': "appBoton() === 'primario' || appBoton() === ''",
    '[class.rg-boton--secundario]': "appBoton() === 'secundario'",
    '[class.rg-boton--peligro]': "appBoton() === 'peligro'",
    '[class.rg-boton--fantasma]': "appBoton() === 'fantasma'",
    '[class.rg-boton--sm]': "tamano() === 'sm'",
    '[class.rg-boton--lg]': "tamano() === 'lg'",
    '[class.rg-boton--bloque]': 'bloque()',
    '[class.rg-boton--cargando]': 'cargando()',
    '[attr.aria-busy]': 'cargando()',
    '[attr.aria-disabled]': 'cargando() ? "true" : null',
  },
})
export class BotonDirective {
  readonly appBoton = input<VarianteBoton | ''>('primario');
  readonly tamano = input<TamanoBoton>('md', { alias: 'appBotonTamano' });
  readonly bloque = input(false, { alias: 'appBotonBloque', transform: booleanAttribute });
  readonly cargando = input(false, { alias: 'appBotonCargando', transform: booleanAttribute });
}
