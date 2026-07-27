import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { CargaImagenTiendaService } from '../../acceso-datos/carga-imagen-tienda.service';
import { TipoImagenTienda } from '../../modelos/vendedor.model';

interface ReglaImagenTienda {
  readonly etiqueta: string;
  readonly descripcion: string;
  readonly anchoMinimo: number;
  readonly altoMinimo: number;
  readonly proporcionMinima: number;
  readonly proporcionMaxima: number;
}

const MAXIMO_BYTES = 5 * 1024 * 1024;
const FORMATOS_PERMITIDOS = new Set(['image/jpeg', 'image/png', 'image/webp']);
const REGLAS: Record<TipoImagenTienda, ReglaImagenTienda> = {
  LOGO: {
    etiqueta: 'Logo',
    descripcion: 'PNG, JPEG o WebP cuadrado de al menos 512 × 512 px.',
    anchoMinimo: 512,
    altoMinimo: 512,
    proporcionMinima: 0.9,
    proporcionMaxima: 1.1,
  },
  PORTADA: {
    etiqueta: 'Portada',
    descripcion: 'PNG, JPEG o WebP horizontal de al menos 1500 × 500 px.',
    anchoMinimo: 1500,
    altoMinimo: 500,
    proporcionMinima: 2,
    proporcionMaxima: 5,
  },
};

/** Editor compacto de logo y portada con validación previa a la carga segura. */
@Component({
  selector: 'app-gestor-identidad-tienda',
  templateUrl: './gestor-identidad-tienda.html',
  styleUrl: './gestor-identidad-tienda.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GestorIdentidadTiendaComponent {
  private readonly cargaImagenTienda = inject(CargaImagenTiendaService);
  private readonly destroyRef = inject(DestroyRef);

  readonly idTienda = input.required<number>();
  readonly nombreTienda = input('Tienda REGALIA');
  readonly urlLogoInicial = input<string | null>(null);
  readonly urlPortadaInicial = input<string | null>(null);
  readonly actualizado = output<void>();

  readonly urlLogo = signal<string | null>(null);
  readonly urlPortada = signal<string | null>(null);
  readonly cargandoTipo = signal<TipoImagenTienda | null>(null);
  readonly mensajeError = signal<string | null>(null);
  readonly mensajeExito = signal<string | null>(null);

  ngOnChanges(): void {
    if (this.cargandoTipo() === null) {
      this.urlLogo.set(this.urlLogoInicial());
      this.urlPortada.set(this.urlPortadaInicial());
    }
  }

  seleccionarArchivo(tipo: TipoImagenTienda, evento: Event): void {
    const inputArchivo = evento.target as HTMLInputElement;
    const archivo = inputArchivo.files?.item(0) ?? null;
    inputArchivo.value = '';
    if (!archivo || this.cargandoTipo() !== null) return;

    this.mensajeError.set(null);
    this.mensajeExito.set(null);
    this.cargandoTipo.set(tipo);

    void this.validarYSubir(tipo, archivo);
  }

  regla(tipo: TipoImagenTienda): ReglaImagenTienda {
    return REGLAS[tipo];
  }

  private async validarYSubir(tipo: TipoImagenTienda, archivo: File): Promise<void> {
    try {
      this.validarArchivo(tipo, archivo, await this.obtenerDimensiones(archivo));
      this.cargaImagenTienda
        .cargarArchivo(this.idTienda(), tipo, archivo)
        .pipe(finalize(() => this.cargandoTipo.set(null)), takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (imagen) => {
            if (imagen.tipoImagen === 'LOGO') this.urlLogo.set(imagen.urlImagen);
            else this.urlPortada.set(imagen.urlImagen);
            this.mensajeExito.set(`${REGLAS[tipo].etiqueta} actualizada correctamente.`);
            this.actualizado.emit();
          },
          error: () => this.mensajeError.set('No pudimos actualizar la imagen. Inténtalo nuevamente.'),
        });
    } catch (error) {
      this.cargandoTipo.set(null);
      this.mensajeError.set(error instanceof Error ? error.message : 'No pudimos validar la imagen.');
    }
  }

  private validarArchivo(
    tipo: TipoImagenTienda,
    archivo: File,
    dimensiones: { ancho: number; alto: number },
  ): void {
    if (!FORMATOS_PERMITIDOS.has(archivo.type)) {
      throw new Error('Elige una imagen JPEG, PNG o WebP.');
    }
    if (archivo.size > MAXIMO_BYTES) {
      throw new Error('La imagen debe pesar como máximo 5 MB.');
    }

    const regla = REGLAS[tipo];
    const proporcion = dimensiones.ancho / dimensiones.alto;
    if (
      dimensiones.ancho < regla.anchoMinimo ||
      dimensiones.alto < regla.altoMinimo ||
      proporcion < regla.proporcionMinima ||
      proporcion > regla.proporcionMaxima
    ) {
      throw new Error(`La imagen no cumple la proporción recomendada para ${regla.etiqueta.toLowerCase()}. ${regla.descripcion}`);
    }
  }

  private obtenerDimensiones(archivo: File): Promise<{ ancho: number; alto: number }> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(archivo);
      const imagen = new Image();
      imagen.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ ancho: imagen.naturalWidth, alto: imagen.naturalHeight });
      };
      imagen.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('No pudimos leer esta imagen. Elige otro archivo.'));
      };
      imagen.src = url;
    });
  }
}
