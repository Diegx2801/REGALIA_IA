import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
import { CarritoCheckoutService } from '../../../../core/carrito/carrito-checkout.service';
import { ProductoApiService } from '../../acceso-datos/producto-api.service';
import { Producto } from '../../modelos/producto.model';
import { PaginaDetalleProducto } from './pagina-detalle-producto';

describe('PaginaDetalleProducto', () => {
  let harness: RouterTestingHarness;
  let productoApi: { obtenerProductoPorId: ReturnType<typeof vi.fn> };
  let carrito: {
    agregarProducto: ReturnType<typeof vi.fn>;
    actualizarObservacion: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    productoApi = { obtenerProductoPorId: vi.fn(() => of(PRODUCTO)) };
    carrito = {
      agregarProducto: vi.fn(),
      actualizarObservacion: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: ProductoApiService, useValue: productoApi },
        { provide: CarritoCheckoutService, useValue: carrito },
        provideRouter([{ path: 'catalogo/:idProducto', component: PaginaDetalleProducto }]),
      ],
    });

    harness = await RouterTestingHarness.create();
  });

  it('carga el producto y permite recorrer su galería', async () => {
    const pagina = await harness.navigateByUrl('/catalogo/7', PaginaDetalleProducto);
    await harness.fixture.whenStable();

    expect(productoApi.obtenerProductoPorId).toHaveBeenCalledWith(7);
    expect(harness.routeNativeElement?.textContent).toContain('Box celebración premium');

    pagina.seleccionarImagen(1);

    expect(pagina.indiceImagenActiva()).toBe(1);
    expect(pagina.imagenActiva()).toBe('/producto-2.webp');
  });

  it('agrega cantidad y personalización al carrito sin abandonar el detalle', async () => {
    const pagina = await harness.navigateByUrl('/catalogo/7', PaginaDetalleProducto);
    await harness.fixture.whenStable();
    pagina.aumentarCantidad(PRODUCTO);
    pagina.notaPersonalizacion.setValue('Incluir una tarjeta por su cumpleaños.');

    pagina.agregarAlCarrito(PRODUCTO);

    expect(carrito.agregarProducto).toHaveBeenCalledWith(PRODUCTO, 2);
    expect(carrito.actualizarObservacion).toHaveBeenCalledWith(
      7,
      'Incluir una tarjeta por su cumpleaños.',
    );
    expect(pagina.mensajeCarrito()).toContain('2 unidades agregadas');
  });
});

const PRODUCTO: Producto = {
  idProducto: 7,
  idTienda: 3,
  nombreTienda: 'Detalles REGALIA',
  idTipoProducto: 2,
  tipoProducto: 'PACK O BOX',
  nombre: 'Box celebración premium',
  descripcion: 'Una selección especial lista para regalar.',
  precio: 89.9,
  stock: 4,
  disponible: true,
  imagenes: [
    { urlImagen: '/producto-1.webp', orden: 1 },
    { urlImagen: '/producto-2.webp', orden: 2 },
  ],
};
