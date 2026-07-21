import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CarritoCheckoutService } from '../../../core/carrito/carrito-checkout.service';
import { ProductoApiService } from '../../../domains/catalogo/acceso-datos/producto-api.service';
import { Producto } from '../../../domains/catalogo/modelos/producto.model';
import { TipoProductoApiService } from '../../../domains/datos-maestros/acceso-datos/tipo-producto-api.service';
import { TiendaPublicaApiService } from '../../../domains/tiendas/acceso-datos/tienda-publica-api.service';
import { PaginaInicio } from './pagina-inicio';

const producto: Producto = {
  idProducto: 3,
  idTienda: 1,
  nombreTienda: 'Bienestar Natural',
  idTipoProducto: 3,
  tipoProducto: 'PACK O BOX',
  nombre: 'Box mamá edición especial',
  descripcion: 'Box premium listo para regalar.',
  precio: 129,
  stock: 14,
  imagenes: [{ urlImagen: '/assets/brand/producto-fallback.svg', orden: 1 }],
  disponible: true,
};

describe('PaginaInicio', () => {
  const obtenerProductos = vi.fn(() =>
    of({
      contenido: [producto],
      paginaActual: 0,
      tamanioPagina: 8,
      totalElementos: 1,
      totalPaginas: 1,
      ultimaPagina: true,
    }),
  );
  const obtenerTiposProducto = vi.fn(() =>
    of([{ idTipoProducto: 3, nombre: 'PACK O BOX', estado: true }]),
  );
  const obtenerTiendasPublicas = vi.fn(() =>
    of([
      {
        idTienda: 1,
        nombre: 'Bienestar Natural',
        descripcion: 'Tienda local de regalos.',
        direccionReferencia: 'Miraflores, Lima',
        estadoRevision: 'APROBADA',
        tiendaFormalizada: false,
        rubros: [{ idRubro: 5, nombre: 'BOXES Y CANASTAS' }],
      },
    ]),
  );
  const agregarProducto = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ProductoApiService, useValue: { obtenerProductos } },
        { provide: TipoProductoApiService, useValue: { obtenerTiposProducto } },
        { provide: TiendaPublicaApiService, useValue: { obtenerTiendasPublicas } },
        { provide: CarritoCheckoutService, useValue: { agregarProducto } },
      ],
    });
  });

  it('presenta categorías, tiendas y productos obtenidos de las APIs reales', async () => {
    const fixture = TestBed.createComponent(PaginaInicio);

    await fixture.whenStable();

    const contenido = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(contenido).toContain('PACK O BOX');
    expect(contenido).toContain('Bienestar Natural');
    expect(contenido).toContain('Box mamá edición especial');
    expect(obtenerProductos).toHaveBeenCalledWith({ size: 8, soloDisponibles: true });
    expect(
      fixture.nativeElement.querySelector('.category-card__visual')?.getAttribute('data-icono'),
    ).toBe('box');
  });

  it('navega al catálogo con el término escrito por el cliente', async () => {
    const fixture = TestBed.createComponent(PaginaInicio);
    const router = TestBed.inject(Router);
    const navegar = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    await fixture.whenStable();

    fixture.componentInstance.controlBusqueda.setValue('flores premium');
    fixture.componentInstance.buscarRegalos();

    expect(navegar).toHaveBeenCalledWith(['/catalogo'], {
      queryParams: { busqueda: 'flores premium' },
    });
  });

  it('agrega un producto disponible al carrito y anuncia el resultado', async () => {
    const fixture = TestBed.createComponent(PaginaInicio);
    await fixture.whenStable();

    fixture.componentInstance.agregarAlCarrito(producto);
    await fixture.whenStable();

    expect(agregarProducto).toHaveBeenCalledWith(producto);
    expect(fixture.componentInstance.mensajeCarrito()).toContain('se agregó a tu carrito');
  });

  it('permite reintentar cada bloque de descubrimiento con su fuente correspondiente', async () => {
    const fixture = TestBed.createComponent(PaginaInicio);
    await fixture.whenStable();
    vi.clearAllMocks();

    fixture.componentInstance.cargarCategorias();
    fixture.componentInstance.cargarTiendasDestacadas();
    fixture.componentInstance.cargarProductosDestacados();

    expect(obtenerTiposProducto).toHaveBeenCalledOnce();
    expect(obtenerTiendasPublicas).toHaveBeenCalledOnce();
    expect(obtenerProductos).toHaveBeenCalledOnce();
  });

  it('actualiza la campaña seleccionada en lugar de ofrecer botones sin acción', async () => {
    const fixture = TestBed.createComponent(PaginaInicio);
    await fixture.whenStable();
    const botones = fixture.nativeElement.querySelectorAll(
      '.festive-calendar__events button',
    ) as NodeListOf<HTMLButtonElement>;

    botones[1].click();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('#titulo-calendario')?.textContent).toContain(
      'Día de la Mujer',
    );
    expect(botones[1].getAttribute('aria-pressed')).toBe('true');
    expect(
      fixture.nativeElement.querySelector('.festive-calendar__month h2')?.textContent,
    ).toContain('MAR 2026');
    const fechaDestacada = fixture.nativeElement.querySelector(
      '.festive-calendar__days button.is-event',
    ) as HTMLButtonElement | null;
    expect(fechaDestacada?.getAttribute('aria-label')).toContain('8 de MAR: Día de la Mujer');
  });

  it('actualiza el calendario completo y explica los meses sin campaña', async () => {
    const fixture = TestBed.createComponent(PaginaInicio);
    await fixture.whenStable();

    const botonAbril = Array.from(
      fixture.nativeElement.querySelectorAll(
        '.festive-calendar__months button',
      ) as NodeListOf<HTMLButtonElement>,
    ).find((boton) => boton.textContent?.trim() === 'ABR');
    botonAbril?.click();
    await fixture.whenStable();

    expect(botonAbril?.getAttribute('aria-pressed')).toBe('true');
    expect(
      fixture.nativeElement.querySelector('.festive-calendar__month h2')?.textContent,
    ).toContain('ABR 2026');
    expect(fixture.nativeElement.querySelectorAll('.festive-calendar__days button')).toHaveLength(
      0,
    );
    expect(fixture.nativeElement.textContent).toContain('No hay una campaña destacada en ABR');
  });
});
