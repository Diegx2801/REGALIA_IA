import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BotonDirective } from '../../../../shared/directivas/boton.directive';
import {
  CampoFormularioDirective,
  ErrorCampoDirective,
  FormularioPanelDirective,
} from '../../../../shared/directivas/formulario-panel.directive';
import { EstadoPantallaComponent } from '../../../../shared/ui/estado-pantalla/estado-pantalla';
import { VendedorApiService } from '../../acceso-datos/vendedor-api.service';
import { VendedorPanelStore } from '../../estado/vendedor-panel.store';

/** Editor de producto con contexto explícito de tienda; no reutiliza un formulario lateral. */
@Component({
  selector: 'app-pagina-vendedor-productos',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    BotonDirective,
    CampoFormularioDirective,
    ErrorCampoDirective,
    FormularioPanelDirective,
    EstadoPantallaComponent,
  ],
  templateUrl: './pagina-vendedor-productos.html',
  styleUrl: './pagina-vendedor-productos.css',
})
export class PaginaVendedorProductos implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly vendedorApi = inject(VendedorApiService);

  readonly store = inject(VendedorPanelStore);
  readonly idTienda = signal<number | null>(null);
  readonly idProducto = signal<number | null>(null);
  readonly cargandoProducto = signal(false);
  readonly urlImagenActual = signal<string | null>(null);

  readonly formularioProducto = new FormGroup({
    idTipoProducto: new FormControl<number | null>(null, [Validators.required]),
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(150)] }),
    descripcion: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(1000)] }),
    precio: new FormControl(0, { nonNullable: true, validators: [Validators.required, Validators.min(0.01)] }),
    stock: new FormControl(0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    visibleEnTienda: new FormControl(true, { nonNullable: true }),
  });

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const idTienda = Number(params.get('idTienda'));
      const idProducto = this.obtenerIdOpcional(params.get('idProducto'));
      if (!Number.isInteger(idTienda) || idTienda <= 0) return;

      this.idTienda.set(idTienda);
      this.idProducto.set(idProducto);
      this.store.cargarPanel(false, false, idTienda);

      if (idProducto !== null) this.cargarProducto(idTienda, idProducto);
    });
  }

  guardarProducto(): void {
    this.store.limpiarMensajes();
    if (this.formularioProducto.invalid) {
      this.formularioProducto.markAllAsTouched();
      return;
    }

    const idTienda = this.idTienda();
    const valor = this.formularioProducto.getRawValue();
    if (idTienda === null || valor.idTipoProducto === null) return;

    this.store.guardarProducto(idTienda, {
      idTipoProducto: valor.idTipoProducto,
      nombre: valor.nombre.trim(),
      descripcion: valor.descripcion.trim() || null,
      precio: Number(valor.precio),
      stock: Number(valor.stock),
      visibleEnTienda: valor.visibleEnTienda,
      // Conserva una imagen heredada hasta habilitar la carga directa de archivos.
      urlImagen: this.urlImagenActual(),
    }, this.idProducto() ?? undefined);
  }

  campoTieneError(campo: keyof typeof this.formularioProducto.controls): boolean {
    const control = this.formularioProducto.controls[campo];
    return control.invalid && (control.touched || control.dirty);
  }

  private cargarProducto(idTienda: number, idProducto: number): void {
    this.cargandoProducto.set(true);
    this.vendedorApi.obtenerProductoPorId(idTienda, idProducto)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (producto) => {
          this.formularioProducto.reset({
            idTipoProducto: producto.idTipoProducto,
            nombre: producto.nombre,
            descripcion: producto.descripcion === 'Sin descripcion registrada.' ? '' : producto.descripcion,
            precio: producto.precio,
            stock: producto.stock,
            visibleEnTienda: producto.visibleEnTienda,
          });
          this.urlImagenActual.set(producto.urlImagen.includes('producto-fallback.svg') ? null : producto.urlImagen);
          this.cargandoProducto.set(false);
        },
        error: () => {
          this.store.mensajeError.set('No pudimos cargar el producto solicitado.');
          this.cargandoProducto.set(false);
        },
      });
  }

  private obtenerIdOpcional(valor: string | null): number | null {
    const id = Number(valor);
    return Number.isInteger(id) && id > 0 ? id : null;
  }
}
