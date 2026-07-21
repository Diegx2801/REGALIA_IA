import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { SesionAutenticacionService } from '../autenticacion/sesion-autenticacion.service';
import { CambioIdentidadSesion } from '../autenticacion/sesion-autenticacion.model';
import { Producto } from '../../domains/catalogo/modelos/producto.model';
import { CarritoCheckoutService } from './carrito-checkout.service';

const CLAVE_CARRITO_LEGADA = 'regalia.carrito.checkout';
const CLAVE_CARRITO_INVITADO = 'regalia.carrito.checkout.invitado';

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

    const persistido = JSON.parse(
      localStorage.getItem(CLAVE_CARRITO_INVITADO) ?? '[]',
    ) as unknown[];
    expect(persistido).toHaveLength(1);
  });

  it('impide agregar productos agotados', () => {
    const carrito = TestBed.inject(CarritoCheckoutService);

    expect(carrito.agregarProducto(crearProducto({ stock: 0 }))).toBe(false);
    expect(carrito.agregarProducto(crearProducto({ disponible: false }))).toBe(false);
    expect(carrito.estaVacio()).toBe(true);
  });

  it('aísla el carrito entre cuentas y migra el carrito invitado al iniciar sesión', () => {
    const cambios = new Subject<CambioIdentidadSesion>();
    const usuarioActual = signal<{ idUsuario: number } | null>(null);
    TestBed.overrideProvider(SesionAutenticacionService, {
      useValue: { usuarioActual, cambiosIdentidad$: cambios.asObservable() },
    });
    const carrito = TestBed.inject(CarritoCheckoutService);
    carrito.agregarProducto(crearProducto({ idProducto: 1 }));

    usuarioActual.set({ idUsuario: 10 });
    cambios.next({ idUsuarioAnterior: null, idUsuarioActual: 10, motivo: 'inicio' });
    expect(carrito.items().map((item) => item.idProducto)).toEqual([1]);

    usuarioActual.set({ idUsuario: 20 });
    cambios.next({ idUsuarioAnterior: 10, idUsuarioActual: 20, motivo: 'reemplazo' });
    expect(carrito.estaVacio()).toBe(true);
    carrito.agregarProducto(crearProducto({ idProducto: 2 }));

    usuarioActual.set({ idUsuario: 10 });
    cambios.next({ idUsuarioAnterior: 20, idUsuarioActual: 10, motivo: 'reemplazo' });
    expect(carrito.items().map((item) => item.idProducto)).toEqual([1]);
  });

  it('limpia localStorage corrupto y evita romper la aplicacion', () => {
    localStorage.setItem(CLAVE_CARRITO_LEGADA, '{json-invalido');

    const carrito = TestBed.inject(CarritoCheckoutService);

    expect(carrito.estaVacio()).toBe(true);
    expect(localStorage.getItem(CLAVE_CARRITO_LEGADA)).toBeNull();
    expect(localStorage.getItem(CLAVE_CARRITO_INVITADO)).toBeNull();
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
