import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { SesionAutenticacionService } from '../../../core/autenticacion/sesion-autenticacion.service';
import { CarritoCheckoutService } from '../../../core/carrito/carrito-checkout.service';
import { Producto } from '../../../domains/catalogo/modelos/producto.model';
import { BuilderIaApiService } from '../acceso-datos/builder-ia-api.service';
import { ResultadoRecomendacionIa } from '../modelos/builder-ia.model';
import { PaginaPedirConIa } from './pagina-pedir-con-ia';

describe('PaginaPedirConIa', () => {
  let fixture: ComponentFixture<PaginaPedirConIa>;
  let pagina: PaginaPedirConIa;
  let respuesta$: Subject<ResultadoRecomendacionIa>;
  let builderIaApi: { recomendarProductos: ReturnType<typeof vi.fn> };
  let carrito: { agregarProducto: ReturnType<typeof vi.fn> };
  let autenticado: ReturnType<typeof signal<boolean>>;
  let sesion: {
    estaAutenticado: ReturnType<typeof signal<boolean>>;
    tieneRol: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    respuesta$ = new Subject<ResultadoRecomendacionIa>();
    builderIaApi = { recomendarProductos: vi.fn(() => respuesta$) };
    carrito = { agregarProducto: vi.fn() };
    autenticado = signal(true);
    sesion = { estaAutenticado: autenticado, tieneRol: vi.fn(() => true) };

    TestBed.configureTestingModule({
      providers: [
        { provide: BuilderIaApiService, useValue: builderIaApi },
        { provide: CarritoCheckoutService, useValue: carrito },
        { provide: SesionAutenticacionService, useValue: sesion },
        provideRouter([]),
      ],
    });

    fixture = TestBed.createComponent(PaginaPedirConIa);
    pagina = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('invita a autenticarse y no consulta la IA cuando no existe sesión', async () => {
    autenticado.set(false);
    pagina.formulario.controls.necesidad.setValue('Regalo para aniversario');

    pagina.continuar();
    await fixture.whenStable();

    expect(builderIaApi.recomendarProductos).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain(
      'Inicia sesión para recibir recomendaciones',
    );
    expect(fixture.nativeElement.querySelector('a[href^="/login"]')).not.toBeNull();
  });

  it('mantiene la solicitud reactiva y muestra carga durante la consulta', async () => {
    pagina.formulario.controls.necesidad.setValue('Regalo de graduación hasta S/ 120');

    pagina.continuar();
    await fixture.whenStable();

    expect(pagina.descripcionActual()).toBe('Regalo de graduación hasta S/ 120');
    expect(builderIaApi.recomendarProductos).toHaveBeenCalledWith({
      busqueda: 'Regalo de graduación hasta S/ 120',
    });
    expect(pagina.cargandoRecomendaciones()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Estamos buscando opciones reales');
  });

  it('presenta interpretación y productos juntos antes de confirmar', async () => {
    pagina.formulario.controls.necesidad.setValue('Flores para aniversario');
    pagina.continuar();
    respuesta$.next({ respuesta: 'Buscamos una opción romántica y disponible.', productosRecomendados: [PRODUCTO] });
    respuesta$.complete();
    await fixture.whenStable();

    expect(pagina.pasoActual()).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('Por qué elegimos estas opciones');
    expect(fixture.nativeElement.textContent).toContain(PRODUCTO.nombre);

    pagina.seleccionarProducto(PRODUCTO);
    pagina.continuar();
    pagina.confirmarSolicitud();
    pagina.confirmarSolicitud();
    await fixture.whenStable();

    expect(pagina.pasoActual()).toBe(3);
    expect(carrito.agregarProducto).toHaveBeenCalledTimes(1);
    expect(pagina.mensajeExito()).toContain('Producto agregado');
  });

  it('muestra un error recuperable cuando falla el asistente', async () => {
    pagina.formulario.controls.necesidad.setValue('Detalle para cumpleaños');
    pagina.continuar();
    respuesta$.error(new Error('El asistente no está disponible temporalmente.'));
    await fixture.whenStable();

    expect(pagina.cargandoRecomendaciones()).toBe(false);
    expect(pagina.mensajeError()).toContain('temporalmente');
    expect(fixture.nativeElement.textContent).toContain('Intentar nuevamente');
  });
});

const PRODUCTO: Producto = {
  idProducto: 3,
  idTienda: 1,
  nombreTienda: 'Bienestar Natural',
  idTipoProducto: 0,
  tipoProducto: 'PACK O BOX',
  nombre: 'Box celebración premium',
  descripcion: 'Detalle listo para regalar.',
  precio: 129,
  stock: 10,
  imagenes: [{ urlImagen: '/assets/brand/producto-fallback.svg', orden: 0 }],
  disponible: true,
};
