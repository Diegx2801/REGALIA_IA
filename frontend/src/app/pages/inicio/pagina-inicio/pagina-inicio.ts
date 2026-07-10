import { CurrencyPipe } from '@angular/common';
import { AfterViewInit, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ProductoApiService } from '../../../domains/catalogo/acceso-datos/producto-api.service';
import { Producto } from '../../../domains/catalogo/modelos/producto.model';

interface CategoriaInicio {
  readonly etiqueta: string;
  readonly tipoIcono: 'cuadro' | 'circulo' | 'anillo' | 'tarjeta' | 'hoja' | 'mas';
  readonly busqueda?: string;
}

interface CampanaComercial {
  readonly fecha: string;
  readonly titulo: string;
  readonly descripcion: string;
  readonly sugerencias: readonly string[];
}

interface PasoModeloNegocio {
  readonly numero: string;
  readonly descripcion: string;
}

@Component({
  selector: 'app-pagina-inicio',
  imports: [CurrencyPipe, ReactiveFormsModule, RouterLink],
  templateUrl: './pagina-inicio.html',
  styleUrl: './pagina-inicio.css',
})
export class PaginaInicio implements AfterViewInit, OnInit {
  private readonly router = inject(Router);
  private readonly productoApiService = inject(ProductoApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly formularioBusqueda = new FormGroup({
    ocasion: new FormControl('Dia de la Madre', { nonNullable: true }),
    presupuesto: new FormControl('S/ 50 - S/ 300+', { nonNullable: true }),
    fecha: new FormControl('', { nonNullable: true }),
    distrito: new FormControl('Todos', { nonNullable: true }),
  });

  readonly mesActivo = signal('FEB');
  readonly productosDestacados = signal<Producto[]>([]);
  readonly cargandoProductosDestacados = signal(true);
  readonly mensajeErrorProductosDestacados = signal<string | null>(null);

  readonly categorias: readonly CategoriaInicio[] = [
    { etiqueta: 'Cumpleanos', tipoIcono: 'cuadro', busqueda: 'cumpleanos' },
    { etiqueta: 'Dia de la Madre', tipoIcono: 'circulo', busqueda: 'madre' },
    { etiqueta: 'Aniversarios', tipoIcono: 'anillo', busqueda: 'aniversario' },
    { etiqueta: 'Graduacion', tipoIcono: 'tarjeta', busqueda: 'graduacion' },
    { etiqueta: 'Condolencias', tipoIcono: 'hoja', busqueda: 'condolencias' },
    { etiqueta: 'Mas categorias', tipoIcono: 'mas' },
  ];

  readonly meses = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
  readonly diasSemana = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'];
  readonly diasFebrero = Array.from({ length: 28 }, (_, indice) => indice + 1);

  readonly campanas: readonly CampanaComercial[] = [
    {
      fecha: '14 FEB',
      titulo: 'San Valentin',
      descripcion: 'Flores y detalles romanticos',
      sugerencias: ['Ramos premium', 'Box romantico', 'Torta mini'],
    },
    {
      fecha: '08 MAR',
      titulo: 'Dia de la Mujer',
      descripcion: 'Experiencias delicadas y mensajes memorables',
      sugerencias: ['Box floral', 'Carta premium', 'Chocolate artesanal'],
    },
    {
      fecha: '2DO MAY',
      titulo: 'Dia de la Madre',
      descripcion: 'Sorpresas elegantes para agradecer con estilo',
      sugerencias: ['Desayuno sorpresa', 'Arreglo floral', 'Taza personalizada'],
    },
    {
      fecha: '3ER JUN',
      titulo: 'Dia del Padre',
      descripcion: 'Regalos sobrios, utiles y con personalidad',
      sugerencias: ['Kit ejecutivo', 'Box gourmet', 'Agenda personalizada'],
    },
    {
      fecha: '31 OCT',
      titulo: 'Halloween',
      descripcion: 'Campanas tematicas para marcas y celebraciones',
      sugerencias: ['Candy box', 'Mini cake', 'Pack tematico'],
    },
    {
      fecha: '25 DIC',
      titulo: 'Navidad',
      descripcion: 'Temporada alta para detalles familiares y corporativos',
      sugerencias: ['Canasta premium', 'Gift box', 'Vino y chocolates'],
    },
  ];

  readonly pasosModeloNegocio: readonly PasoModeloNegocio[] = [
    { numero: '01', descripcion: 'El cliente describe ocasion, presupuesto, fecha y distrito.' },
    { numero: '02', descripcion: 'REGALIA compara disponibilidad, reputacion, cercania y estilo.' },
    { numero: '03', descripcion: 'El vendedor recibe solicitudes compatibles, no conversaciones al azar.' },
    { numero: '04', descripcion: 'La plataforma monetiza por reserva, campanas destacadas y visibilidad premium.' },
  ];

  ngAfterViewInit(): void {
    if (this.router.url.startsWith('/modelo')) {
      setTimeout(() => document.querySelector('#modelo')?.scrollIntoView({ behavior: 'smooth' }));
    }
  }

  ngOnInit(): void {
    this.cargarProductosDestacados();
  }

  buscarDetalles(): void {
    const valores = this.formularioBusqueda.getRawValue();
    const filtros = [valores.ocasion, valores.presupuesto, valores.distrito]
      .map((valor) => valor.trim())
      .filter(Boolean)
      .join(' ');

    void this.router.navigate(['/catalogo'], {
      queryParams: filtros ? { busqueda: filtros } : undefined,
    });
  }

  buscarCategoria(categoria: CategoriaInicio): void {
    void this.router.navigate(['/catalogo'], {
      queryParams: categoria.busqueda ? { busqueda: categoria.busqueda } : undefined,
    });
  }

  obtenerImagenProducto(producto: Producto): string {
    return producto.imagenes[0]?.urlImagen ?? '/assets/brand/producto-fallback.svg';
  }

  identificarProducto(_indice: number, producto: Producto): number {
    return producto.idProducto;
  }

  private cargarProductosDestacados(): void {
    this.cargandoProductosDestacados.set(true);
    this.mensajeErrorProductosDestacados.set(null);

    this.productoApiService
      .obtenerProductos()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.cargandoProductosDestacados.set(false)),
      )
      .subscribe({
        next: (productos) => {
          const destacados = productos.filter((producto) => producto.disponible).slice(0, 4);
          this.productosDestacados.set(destacados);
        },
        error: () => {
          this.productosDestacados.set([]);
          this.mensajeErrorProductosDestacados.set('No pudimos cargar productos destacados reales.');
        },
      });
  }
}
