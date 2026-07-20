import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { CarritoCheckoutService } from '../../../../core/carrito/carrito-checkout.service';
import { ItemCarrito } from '../../../../core/carrito/carrito.model';
import { PaginaCarrito } from './pagina-carrito';

describe('PaginaCarrito', () => {
  let fixture: ComponentFixture<PaginaCarrito>;
  let pagina: PaginaCarrito;
  let items: ReturnType<typeof signal<ItemCarrito[]>>;
  let carrito: {
    items: ReturnType<typeof signal<ItemCarrito[]>>;
    cantidadItems: () => number;
    total: () => number;
    estaVacio: () => boolean;
    actualizarCantidad: ReturnType<typeof vi.fn>;
    actualizarObservacion: ReturnType<typeof vi.fn>;
    quitarProducto: ReturnType<typeof vi.fn>;
    limpiarCarrito: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
      configurable: true,
      value: vi.fn(function (this: HTMLDialogElement) {
        this.setAttribute('open', '');
      }),
    });
    Object.defineProperty(HTMLDialogElement.prototype, 'close', {
      configurable: true,
      value: vi.fn(function (this: HTMLDialogElement) {
        this.removeAttribute('open');
      }),
    });
    items = signal([ITEM]);
    carrito = {
      items,
      cantidadItems: () => items().reduce((total, item) => total + item.cantidad, 0),
      total: () =>
        items().reduce((total, item) => total + item.precioUnitario * item.cantidad, 0),
      estaVacio: () => items().length === 0,
      actualizarCantidad: vi.fn(),
      actualizarObservacion: vi.fn(),
      quitarProducto: vi.fn(),
      limpiarCarrito: vi.fn(() => items.set([])),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: CarritoCheckoutService, useValue: carrito },
        provideRouter([]),
      ],
    });

    fixture = TestBed.createComponent(PaginaCarrito);
    pagina = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('presenta productos y resumen antes de navegar al checkout', async () => {
    const router = TestBed.inject(Router);
    const navegar = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    pagina.prepararCheckout();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Resumen de compra');
    expect(fixture.nativeElement.textContent).toContain('PEN100.00');
    expect(navegar).toHaveBeenCalledWith('/checkout/carrito');
  });

  it('bloquea el checkout cuando el carrito contiene más de una tienda', async () => {
    items.set([{ ...ITEM }, { ...ITEM, idProducto: 2, idTienda: 9, nombre: 'Flores' }]);
    await fixture.whenStable();

    const boton = fixture.nativeElement.querySelector(
      '.cart-summary .cart-button--primary',
    ) as HTMLButtonElement;
    expect(pagina.puedePrepararCheckout()).toBe(false);
    expect(boton.disabled).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('productos de 2 tiendas');
  });

  it('solicita confirmación antes de vaciar el carrito', async () => {
    pagina.solicitarVaciarCarrito();
    await fixture.whenStable();

    expect(pagina.confirmacionVaciarAbierta()).toBe(true);
    expect(carrito.limpiarCarrito).not.toHaveBeenCalled();

    pagina.confirmarVaciarCarrito();
    await fixture.whenStable();

    expect(carrito.limpiarCarrito).toHaveBeenCalledOnce();
    expect(pagina.confirmacionVaciarAbierta()).toBe(false);
  });
});

const ITEM: ItemCarrito = {
  idProducto: 1,
  idTienda: 4,
  nombre: 'Box celebración',
  nombreTienda: 'Detalles Lima',
  tipoProducto: 'PACK O BOX',
  precioUnitario: 50,
  cantidad: 2,
  stockDisponible: 8,
  urlImagen: '/assets/brand/producto-fallback.svg',
  observacion: null,
};
