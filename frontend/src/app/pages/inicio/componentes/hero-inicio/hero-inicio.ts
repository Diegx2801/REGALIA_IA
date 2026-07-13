import { Component, computed, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CampoTexto } from '../../../../shared/ui/formularios/campo-texto/campo-texto';
import { CategoriaInicio } from '../../modelos/inicio.model';

@Component({
  selector: 'app-hero-inicio',
  imports: [CampoTexto, ReactiveFormsModule],
  templateUrl: './hero-inicio.html',
})
export class HeroInicio {
  readonly formularioBusqueda = input.required<FormGroup>();
  readonly categorias = input.required<readonly CategoriaInicio[]>();
  readonly buscarDetalles = output<void>();
  readonly buscarCategoria = output<CategoriaInicio>();

  readonly controlOcasion = computed(
    () => this.formularioBusqueda().get('ocasion') as FormControl<string>,
  );
  readonly controlPresupuesto = computed(
    () => this.formularioBusqueda().get('presupuesto') as FormControl<string>,
  );
  readonly controlFecha = computed(
    () => this.formularioBusqueda().get('fecha') as FormControl<string>,
  );
  readonly controlDistrito = computed(
    () => this.formularioBusqueda().get('distrito') as FormControl<string>,
  );
}
