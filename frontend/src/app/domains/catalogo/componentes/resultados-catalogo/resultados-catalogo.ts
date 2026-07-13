import { Component, DestroyRef, effect, inject, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { EncabezadoSeccion } from '../../../../shared/ui/encabezado-seccion/encabezado-seccion';
import { EstadoPantallaComponent } from '../../../../shared/ui/estado-pantalla/estado-pantalla';
import { CampoSelect } from '../../../../shared/ui/formularios/campo-select/campo-select';
import { InsigniaUi } from '../../../../shared/ui/insignia-ui/insignia-ui';
import { SkeletonCard } from '../../../../shared/ui/skeleton-card/skeleton-card';
import { Producto } from '../../modelos/producto.model';
import { OrdenCatalogo } from '../../modelos/catalogo-ui.model';
import { TarjetaProducto } from '../tarjeta-producto/tarjeta-producto';

@Component({
  selector: 'app-resultados-catalogo',
  imports: [
    CampoSelect,
    EncabezadoSeccion,
    EstadoPantallaComponent,
    InsigniaUi,
    ReactiveFormsModule,
    SkeletonCard,
    TarjetaProducto,
  ],
  templateUrl: './resultados-catalogo.html',
})
export class ResultadosCatalogo {
  private readonly destroyRef = inject(DestroyRef);

  readonly productos = input.required<readonly Producto[]>();
  readonly cargando = input.required<boolean>();
  readonly mensajeError = input.required<string | null>();
  readonly tipoSeleccionado = input.required<string>();
  readonly precioMaximo = input.required<number>();
  readonly soloDisponibles = input.required<boolean>();
  readonly ordenSeleccionado = input.required<OrdenCatalogo>();

  readonly actualizarOrden = output<OrdenCatalogo>();
  readonly limpiarFiltros = output<void>();
  readonly agregarAlCarrito = output<Producto>();

  readonly controlOrden = new FormControl<OrdenCatalogo>('recommended', { nonNullable: true });
  readonly opcionesOrden = [
    { valor: 'recommended', etiqueta: 'Recomendados' },
    { valor: 'priceAsc', etiqueta: 'Menor precio' },
    { valor: 'priceDesc', etiqueta: 'Mayor precio' },
  ] as const;

  constructor() {
    effect(() => {
      this.controlOrden.setValue(this.ordenSeleccionado(), { emitEvent: false });
    });

    this.controlOrden.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((valor) => this.actualizarOrden.emit(valor));
  }

  identificarProducto(_indice: number, producto: Producto): number {
    return producto.idProducto;
  }
}
