import {
  AfterViewInit,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { ProductoApiService } from '../../../domains/catalogo/acceso-datos/producto-api.service';
import { Producto } from '../../../domains/catalogo/modelos/producto.model';
import { CalendarioComercial } from '../componentes/calendario-comercial/calendario-comercial';
import { CtaVendedorInicio } from '../componentes/cta-vendedor-inicio/cta-vendedor-inicio';
import { DestacadosInicio } from '../componentes/destacados-inicio/destacados-inicio';
import { HeroInicio } from '../componentes/hero-inicio/hero-inicio';
import { ModeloNegocioInicio } from '../componentes/modelo-negocio-inicio/modelo-negocio-inicio';
import { CategoriaInicio, CampanaComercial, PasoModeloNegocio } from '../modelos/inicio.model';

@Component({
  selector: 'app-pagina-inicio',
  imports: [
    CalendarioComercial,
    CtaVendedorInicio,
    DestacadosInicio,
    HeroInicio,
    ModeloNegocioInicio,
  ],
  templateUrl: './pagina-inicio.html',
  styleUrl: './pagina-inicio.css',
  // Los estilos usan clases prefijadas por feature; se comparten con componentes internos sin duplicar CSS.
  encapsulation: ViewEncapsulation.None,
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
