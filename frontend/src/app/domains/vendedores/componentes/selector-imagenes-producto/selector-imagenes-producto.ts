import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import {
  esImagenProductoPermitida,
  MAXIMO_IMAGENES_PRODUCTO,
} from '../../modelos/imagen-producto.policy';

/** Archivo validado y conservado localmente hasta que el producto sea creado. */
export interface ImagenProductoPendiente {
  idLocal: string;
  archivo: File;
  urlVistaPrevia: string;
}

/** Selector local reutilizable; no conoce productos, rutas ni proveedores de almacenamiento. */
@Component({
  selector: 'app-selector-imagenes-producto',
  templateUrl: './selector-imagenes-producto.html',
  styleUrl: './selector-imagenes-producto.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectorImagenesProductoComponent {
  readonly imagenes = input<readonly ImagenProductoPendiente[]>([]);
  readonly bloqueado = input(false);
  readonly imagenesSeleccionadas = output<ImagenProductoPendiente[]>();
  readonly imagenEliminada = output<ImagenProductoPendiente>();
  readonly mensajeError = signal<string | null>(null);

  seleccionarArchivos(evento: Event): void {
    const inputArchivo = evento.target as HTMLInputElement;
    const archivos = Array.from(inputArchivo.files ?? []);
    inputArchivo.value = '';
    this.mensajeError.set(null);

    if (archivos.length === 0 || this.bloqueado()) return;

    const disponibles = MAXIMO_IMAGENES_PRODUCTO - this.imagenes().length;
    if (archivos.length > disponibles) {
      this.mensajeError.set(`Puedes agregar hasta ${disponibles} imagen${disponibles === 1 ? '' : 'es'} más.`);
      return;
    }

    const invalido = archivos.find(
      (archivo) => !esImagenProductoPermitida(archivo),
    );
    if (invalido) {
      this.mensajeError.set('Cada archivo debe ser JPEG, PNG o WebP y pesar como máximo 5 MB.');
      return;
    }

    this.imagenesSeleccionadas.emit(
      archivos.map((archivo) => ({
        idLocal: crypto.randomUUID(),
        archivo,
        urlVistaPrevia: URL.createObjectURL(archivo),
      })),
    );
  }

  eliminar(imagen: ImagenProductoPendiente): void {
    if (this.bloqueado()) return;
    this.imagenEliminada.emit(imagen);
  }
}
