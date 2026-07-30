import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, concatMap, finalize, from, map, of, toArray } from 'rxjs';
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
  readonly nombreProducto = input('Producto');
  readonly imagenesIniciales = input<ImagenProductoVendedor[]>([]);
  readonly imagenesCambiadas = output<ImagenProductoVendedor[]>();

  readonly imagenes = signal<ImagenProductoVendedor[]>([]);
  readonly cargando = signal(false);
  readonly procesandoId = signal<number | null>(null);
  readonly mensajeError = signal<string | null>(null);
  readonly mensajeExito = signal<string | null>(null);
  readonly indiceArrastre = signal<number | null>(null);
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
        concatMap((archivo) =>
          this.cargarArchivo(archivo).pipe(
            map((imagen) => ({ imagen, error: false })),
            catchError(() => of({ imagen: null, error: true })),
          ),
        ),
        toArray(),
        finalize(() => this.cargando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (resultados) => {
          const imagenesConfirmadas = resultados.flatMap((resultado) =>
            resultado.imagen === null ? [] : [resultado.imagen],
          );
          const errores = resultados.filter((resultado) => resultado.error).length;

          if (imagenesConfirmadas.length > 0) {
            const actualizadas = [...this.imagenes(), ...imagenesConfirmadas].sort(
              (primera, segunda) => primera.orden - segunda.orden,
            );
            this.actualizarImagenes(actualizadas);
          }

          if (errores > 0) {
            this.mensajeError.set(
              errores === 1
                ? 'Una imagen no pudo cargarse. Las demás imágenes válidas se conservaron.'
                : `${errores} imágenes no pudieron cargarse. Las demás imágenes válidas se conservaron.`,
            );
          } else {
            this.mensajeExito.set('Imágenes agregadas correctamente.');
          }
        },
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
    this.persistirOrden(propuesto, propuesto[destino].idProductoImagen);
  }

  establecerPortada(indice: number): void {
    if (indice === 0 || this.cargando() || this.procesandoId() !== null) return;

    const propuesto = [...this.imagenes()];
    const [portada] = propuesto.splice(indice, 1);
    propuesto.unshift(portada);
    this.persistirOrden(propuesto, portada.idProductoImagen);
  }

  iniciarArrastre(indice: number, evento: DragEvent): void {
    if (this.cargando() || this.procesandoId() !== null) {
      evento.preventDefault();
      return;
    }

    this.indiceArrastre.set(indice);
    evento.dataTransfer?.setData('text/plain', String(indice));
    if (evento.dataTransfer) evento.dataTransfer.effectAllowed = 'move';
  }

  permitirSoltar(evento: DragEvent): void {
    if (this.indiceArrastre() !== null && !this.cargando() && this.procesandoId() === null) {
      evento.preventDefault();
      if (evento.dataTransfer) evento.dataTransfer.dropEffect = 'move';
    }
  }

  soltarEn(indiceDestino: number, evento: DragEvent): void {
    evento.preventDefault();
    const indiceOrigen = this.indiceArrastre();
    this.indiceArrastre.set(null);

    if (
      indiceOrigen === null ||
      indiceOrigen === indiceDestino ||
      this.cargando() ||
      this.procesandoId() !== null
    ) {
      return;
    }

    const propuesto = [...this.imagenes()];
    const [imagenMovida] = propuesto.splice(indiceOrigen, 1);
    propuesto.splice(indiceDestino, 0, imagenMovida);
    this.persistirOrden(propuesto, imagenMovida.idProductoImagen);
  }

  finalizarArrastre(): void {
    this.indiceArrastre.set(null);
  }

  private persistirOrden(propuesto: ImagenProductoVendedor[], idProcesando: number): void {
    if (this.cargando() || this.procesandoId() !== null) return;

    this.procesandoId.set(idProcesando);
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
