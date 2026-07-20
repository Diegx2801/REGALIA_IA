import { TestBed } from '@angular/core/testing';
import { Producto } from '../../domains/catalogo/modelos/producto.model';
import { CarritoCheckoutService } from './carrito-checkout.service';

const CLAVE_CARRITO_REGALIA = 'regalia.carrito.checkout';

describe('CarritoCheckoutService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('agrega productos con Signals y limita cantidad al stock disponible', () => {
    const carrito = TestBed.inject(CarritoCheckoutService);

    carrito.agregarProducto(crearProducto({ stock: 3 }), 10);

    expect(carrito.cantidadItems()).toBe(3);
    expect(carrito.total()).toBe(150);
    expect(carrito.items()[0]).toMatchObject({
      idProducto: 1,
      cantidad: 3,
      stockDisponible: 3,
      urlImagen: '/assets/box.png',
    });
  });

  it('actualiza cantidades y observaciones sin permitir valores invalidos', () => {
    const carrito = TestBed.inject(CarritoCheckoutService);

    carrito.agregarProducto(crearProducto({ stock: 5 }), 2);
    carrito.actualizarCantidad(1, 0);
    carrito.actualizarCantidad(1, Number.NaN);
    carrito.actualizarObservacion(1, '  Mensaje personalizado  ');

    expect(carrito.items()[0].cantidad).toBe(1);
    expect(carrito.items()[0].observacion).toBe('Mensaje personalizado');
  });

  it('persiste el carrito en localStorage para recuperar la solicitud', () => {
    const carrito = TestBed.inject(CarritoCheckoutService);

    carrito.agregarProducto(crearProducto(), 1);

    const persistido = JSON.parse(localStorage.getItem(CLAVE_CARRITO_REGALIA) ?? '[]') as unknown[];
    expect(persistido).toHaveLength(1);
  });

  it('limpia localStorage corrupto y evita romper la aplicacion', () => {
    localStorage.setItem(CLAVE_CARRITO_REGALIA, '{json-invalido');

    const carrito = TestBed.inject(CarritoCheckoutService);

    expect(carrito.estaVacio()).toBe(true);
    expect(localStorage.getItem(CLAVE_CARRITO_REGALIA)).toBeNull();
  });
});

function crearProducto(sobrescritura: Partial<Producto> = {}): Producto {
  return {
    idProducto: 1,
    idTienda: 1,
    nombreTienda: 'Bienestar Natural',
    idTipoProducto: 3,
    tipoProducto: 'PACK O BOX',
    nombre: 'Box REGALIA',
    descripcion: 'Producto listo para regalar',
    precio: 50,
    stock: 5,
    imagenes: [{ urlImagen: '/assets/box.png', orden: 1 }],
    disponible: true,
    ...sobrescritura,
  };
}
