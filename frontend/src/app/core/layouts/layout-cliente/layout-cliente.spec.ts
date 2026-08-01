import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { SesionAutenticacionService } from '../../autenticacion/sesion-autenticacion.service';
import { CarritoCheckoutService } from '../../carrito/carrito-checkout.service';
import { LayoutCliente } from './layout-cliente';

class SesionAutenticacionStub {
  readonly usuarioActual = signal({
    idUsuario: 1,
    nombreCompleto: 'Cliente REGALIA',
    correo: 'cliente@regalia.test',
    roles: ['CLIENTE'] as const,
    rol: 'CLIENTE' as const,
    correoVerificado: true,
  });
  readonly rolActual = signal<'CLIENTE'>('CLIENTE');
  readonly cerrarSesion = vi.fn();
}

class CarritoCheckoutStub {
  readonly cantidadItems = signal(0);
}

describe('LayoutCliente', () => {
  let fixture: ComponentFixture<LayoutCliente>;
  let carrito: CarritoCheckoutStub;

  beforeEach(async () => {
    carrito = new CarritoCheckoutStub();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: SesionAutenticacionService, useClass: SesionAutenticacionStub },
        { provide: CarritoCheckoutService, useValue: carrito },
      ],
    });

    fixture = TestBed.createComponent(LayoutCliente);
    await fixture.whenStable();
  });

  afterEach(() => TestBed.resetTestingModule());

  it('prioriza pedidos y perfil en la navegación de la cuenta', () => {
    const enlaces = fixture.componentInstance.enlaces;

    expect(enlaces.map((enlace) => enlace.ruta)).toEqual(['/cliente/pedidos', '/cliente/perfil']);
    expect(enlaces[0].patronesActivos?.[0].test('/cliente/pedidos/42')).toBe(true);
    expect(enlaces[1].patronesActivos?.[0].test('/cliente/perfil')).toBe(true);
  });

  it('mantiene catálogo y carrito accesibles desde el encabezado', () => {
    const encabezado = fixture.nativeElement.querySelector(
      'nav[aria-label="Acciones rápidas privadas"]',
    ) as HTMLElement;
    const rutas = Array.from(encabezado.querySelectorAll('a')).map((enlace) =>
      enlace.getAttribute('href'),
    );

    expect(rutas).toEqual(['/catalogo', '/carrito']);
    expect(encabezado.textContent).toContain('Explorar');
    expect(encabezado.textContent).toContain('Carrito');
  });

  it('actualiza el contador y la etiqueta accesible del carrito', async () => {
    carrito.cantidadItems.set(3);
    await fixture.whenStable();

    const enlaceCarrito = fixture.nativeElement.querySelector(
      'nav[aria-label="Acciones rápidas privadas"] a[href="/carrito"]',
    ) as HTMLAnchorElement;

    expect(enlaceCarrito.getAttribute('aria-label')).toBe('Abrir carrito, 3 productos');
    expect(enlaceCarrito.textContent).toContain('3');
  });

  it('expone accesos de compra dentro del menú móvil', async () => {
    const botonMenu = fixture.nativeElement.querySelector(
      'button[aria-controls="menu-layout-privado"]',
    ) as HTMLButtonElement;

    botonMenu.click();
    await fixture.whenStable();

    const menu = fixture.nativeElement.querySelector('aside[role="dialog"]') as HTMLElement;
    const accesosCompra = menu.querySelector('nav[aria-label="Accesos de compra"]');

    expect(menu).toBeTruthy();
    expect(accesosCompra?.textContent).toContain('Explorar');
    expect(accesosCompra?.textContent).toContain('Carrito');
  });
  it('permite encontrar destinos reales desde el buscador de secciones', async () => {
    const botonBusqueda = fixture.nativeElement.querySelector(
      'button[aria-haspopup="dialog"]',
    ) as HTMLButtonElement;

    botonBusqueda.click();
    await fixture.whenStable();

    const dialogo = fixture.nativeElement.querySelector(
      '[role="dialog"][aria-labelledby="titulo-paleta-navegacion"]',
    ) as HTMLElement;
    const campo = dialogo.querySelector('input[type="search"]') as HTMLInputElement;

    campo.value = 'carrito';
    campo.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    const resultados = Array.from(dialogo.querySelectorAll('nav a')) as HTMLAnchorElement[];
    expect(resultados).toHaveLength(1);
    expect(resultados[0].getAttribute('href')).toBe('/carrito');
    expect(resultados[0].textContent).toContain('Preparar una compra');
  });

  it('cierra el buscador con Escape y devuelve el foco al disparador', async () => {
    const botonBusqueda = fixture.nativeElement.querySelector(
      'button[aria-haspopup="dialog"]',
    ) as HTMLButtonElement;

    botonBusqueda.focus();
    botonBusqueda.click();
    await fixture.whenStable();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();
    await new Promise((resolver) => setTimeout(resolver, 0));

    expect(fixture.nativeElement.querySelector('#titulo-paleta-navegacion')).toBeNull();
    expect(document.activeElement).toBe(botonBusqueda);
  });
});
