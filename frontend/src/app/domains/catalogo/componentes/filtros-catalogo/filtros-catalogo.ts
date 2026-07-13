import { Component, computed, DestroyRef, effect, inject, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CampoSelect } from '../../../../shared/ui/formularios/campo-select/campo-select';
import { CampoTexto } from '../../../../shared/ui/formularios/campo-texto/campo-texto';

@Component({
  selector: 'app-filtros-catalogo',
  imports: [CampoSelect, CampoTexto, ReactiveFormsModule],
  templateUrl: './filtros-catalogo.html',
})
export class FiltrosCatalogo {
  private readonly destroyRef = inject(DestroyRef);

  readonly categorias = input.required<readonly string[]>();
  readonly terminoBusqueda = input.required<string>();
  readonly tipoSeleccionado = input.required<string>();
  readonly precioMaximo = input.required<number>();
  readonly soloDisponibles = input.required<boolean>();

  readonly actualizarBusqueda = output<string>();
  readonly actualizarTipo = output<string>();
  readonly actualizarPrecioMaximo = output<number | string>();
  readonly actualizarDisponibilidad = output<boolean>();
  readonly limpiarFiltros = output<void>();

  readonly controlBusqueda = new FormControl('', { nonNullable: true });
  readonly controlCategoria = new FormControl('Todas', { nonNullable: true });
  readonly controlPrecioMaximo = new FormControl('300', { nonNullable: true });

  readonly opcionesCategoria = computed(() =>
    this.categorias().map((categoria) => ({ valor: categoria, etiqueta: categoria })),
  );

  constructor() {
    // Los filtros reciben estado desde signals del contenedor y emiten cambios sin conocer la API.
    effect(() => {
      this.controlBusqueda.setValue(this.terminoBusqueda(), { emitEvent: false });
      this.controlCategoria.setValue(this.tipoSeleccionado(), { emitEvent: false });
      this.controlPrecioMaximo.setValue(String(this.precioMaximo()), { emitEvent: false });
    });

    this.controlBusqueda.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((valor) => this.actualizarBusqueda.emit(valor));

    this.controlCategoria.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((valor) => this.actualizarTipo.emit(valor));

    this.controlPrecioMaximo.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((valor) => this.actualizarPrecioMaximo.emit(valor));
  }
}
