import { Component, DestroyRef, effect, inject, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CampoTexto } from '../../../../shared/ui/formularios/campo-texto/campo-texto';

@Component({
  selector: 'app-hero-catalogo',
  imports: [CampoTexto, ReactiveFormsModule, RouterLink],
  templateUrl: './hero-catalogo.html',
})
export class HeroCatalogo {
  private readonly destroyRef = inject(DestroyRef);

  readonly totalProductos = input.required<number>();
  readonly productosDisponibles = input.required<number>();
  readonly terminoBusqueda = input.required<string>();
  readonly actualizarBusqueda = output<string>();

  readonly controlBusqueda = new FormControl('', { nonNullable: true });

  constructor() {
    // Sincroniza el query param recibido por la pagina con el campo reactivo del hero.
    effect(() => {
      this.controlBusqueda.setValue(this.terminoBusqueda(), { emitEvent: false });
    });

    this.controlBusqueda.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((valor) => this.actualizarBusqueda.emit(valor));
  }
}
