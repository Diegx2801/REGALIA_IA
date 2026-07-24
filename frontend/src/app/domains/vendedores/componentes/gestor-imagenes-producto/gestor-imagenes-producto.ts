import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, from, concatMap, toArray } from 'rxjs';
import { CargaImagenProductoService } from '../../acceso-datos/carga-imagen-producto.service';
import { VendedorApiService } from '../../acceso-datos/vendedor-api.service';
import {
  esImagenProductoPermitida,
  MAXIMO_IMAGENES_PRODUCTO,
} from '../../modelos/imagen-producto.policy';
import { ImagenProductoVendedor } from '../../modelos/vendedor.model';
import { confirmarAccionCritica } from '../../../../shared/utilidades/confirmar-accion.util';

/** Galería privada que carga archivos directamente al almacenamiento mediante URLs firmadas. */
@Component({
  selector: 'app-gestor-imagenes-producto',
  templateUrl: './gestor-imagenes-producto.html',
  styleUrl: './gestor-imagenes-producto.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GestorImagenesProductoComponent {
  private readonly api = inject(VendedorApiService);
  private readonly cargaImagenProducto = inject(CargaImagenProductoService);
  private readonly destroyRef = inject(DestroyRef);

  readonly idTienda = input.required<number>();
  readonly idProducto = input.required<number>();
  readonly imagenesIniciales = input<ImagenProductoVendedor[]>([]);
  readonly imagenesCambiadas = output<ImagenProductoVendedor[]>();

  readonly imagenes = signal<ImagenProductoVendedor[]>([]);
  readonly cargando = signal(false);
  readonly procesandoId = signal<number | null>(null);
  readonly mensajeError = signal<string | null>(null);
  readonly mensajeExito = signal<string | null>(null);
  private inicializado = false;

  ngOnChanges(): void {
    if (!this.inicializado || !this.cargando()) {
      this.imagenes.set([...this.imagenesIniciales()].sort((a, b) => a.orden - b.orden));
      this.inicializado = true;
    }
  }

  seleccionarArchivos(evento: Event): void {
    const inputArchivo = evento.target as HTMLInputElement;
    const archivos = Array.from(inputArchivo.files ?? []);
    inputArchivo.value = '';
    this.mensajeError.set(null);
    this.mensajeExito.set(null);

    if (archivos.length === 0 || this.cargando()) return;
    const disponibles = MAXIMO_IMAGENES_PRODUCTO - this.imagenes().length;
    if (archivos.length > disponibles) {
      this.mensajeError.set(`Puedes agregar hasta ${disponibles} imagen${disponibles === 1 ? '' : 'es'} más.`);
      return;
    }
    const invalido = archivos.find((archivo) => !esImagenProductoPermitida(archivo));
    if (invalido) {
      this.mensajeError.set('Cada archivo debe ser JPEG, PNG o WebP y pesar como máximo 5 MB.');
      return;
    }

    this.cargando.set(true);
    from(archivos)
      .pipe(
        concatMap((archivo) => this.cargarArchivo(archivo)),
        toArray(),
        finalize(() => this.cargando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (imagenes) => {
          const actualizadas = [...this.imagenes(), ...imagenes].sort((a, b) => a.orden - b.orden);
          this.actualizarImagenes(actualizadas);
          this.mensajeExito.set('Imágenes agregadas correctamente.');
        },
        error: () => this.mensajeError.set('No pudimos cargar una de las imágenes. Inténtalo nuevamente.'),
      });
  }

  eliminar(imagen: ImagenProductoVendedor): void {
    if (this.cargando() || this.procesandoId() !== null) return;
    if (!confirmarAccionCritica('Eliminarás esta imagen de inmediato. ¿Deseas continuar?')) return;

    this.procesandoId.set(imagen.idProductoImagen);
    this.mensajeError.set(null);
    this.api
      .eliminarImagenProducto(this.idTienda(), this.idProducto(), imagen.idProductoImagen)
      .pipe(finalize(() => this.procesandoId.set(null)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.actualizarImagenes(this.imagenes().filter((actual) => actual.idProductoImagen !== imagen.idProductoImagen));
          this.mensajeExito.set('Imagen eliminada.');
        },
        error: () => this.mensajeError.set('No pudimos eliminar la imagen. Inténtalo nuevamente.'),
      });
  }

  mover(indice: number, desplazamiento: -1 | 1): void {
    const actuales = this.imagenes();
    const destino = indice + desplazamiento;
    if (destino < 0 || destino >= actuales.length || this.cargando() || this.procesandoId() !== null) return;

    const propuesto = [...actuales];
    [propuesto[indice], propuesto[destino]] = [propuesto[destino], propuesto[indice]];
    this.procesandoId.set(propuesto[destino].idProductoImagen);
    this.mensajeError.set(null);
    this.api
      .ordenarImagenesProducto(this.idTienda(), this.idProducto(), propuesto.map((imagen) => imagen.idProductoImagen))
      .pipe(finalize(() => this.procesandoId.set(null)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (imagenes) => this.actualizarImagenes(imagenes),
        error: () => this.mensajeError.set('No pudimos actualizar el orden de las imágenes.'),
      });
  }

  private cargarArchivo(archivo: File) {
    return this.cargaImagenProducto.cargarArchivo(this.idTienda(), this.idProducto(), archivo);
  }

  private actualizarImagenes(imagenes: ImagenProductoVendedor[]): void {
    const ordenadas = imagenes.map((imagen, indice) => ({ ...imagen, orden: indice + 1 }));
    this.imagenes.set(ordenadas);
    this.imagenesCambiadas.emit(ordenadas);
  }
}
