import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { SesionAutenticacionService } from '../../autenticacion/sesion-autenticacion.service';
import { LayoutAdministracion } from './layout-administracion';

@Component({ template: '' })
class PaginaAdministracionPrueba {}

class SesionAutenticacionStub {
  readonly usuarioActual = signal({
    idUsuario: 1,
    nombreCompleto: 'Administradora REGALIA',
    correo: 'admin@regalia.test',
    roles: ['ADMIN'] as const,
    rol: 'ADMIN' as const,
    correoVerificado: true,
  });
  readonly rolActual = signal<'ADMIN'>('ADMIN');
  readonly cerrarSesion = vi.fn();
}

describe('LayoutAdministracion', () => {
  let fixture: ComponentFixture<LayoutAdministracion>;
  let router: Router;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: 'admin/tiendas/:idTienda',
            component: PaginaAdministracionPrueba,
          },
        ]),
        { provide: SesionAutenticacionService, useClass: SesionAutenticacionStub },
      ],
    });

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(LayoutAdministracion);
    await fixture.whenStable();
  });

  afterEach(() => TestBed.resetTestingModule());

  it('muestra únicamente destinos administrativos respaldados por rutas reales', () => {
    const navegacion = fixture.nativeElement.querySelector(
      'nav[aria-label="Secciones de administración"]',
    ) as HTMLElement;
    const rutas = Array.from(navegacion.querySelectorAll('a')).map((enlace) =>
      enlace.getAttribute('href'),
    );

    expect(rutas).toEqual([
      '/admin/resumen',
      '/admin/usuarios',
      '/admin/vendedores',
      '/admin/documentos',
      '/admin/tiendas',
      '/admin/pedidos',
      '/admin/datos-maestros',
    ]);
    expect(navegacion.textContent).toContain('Visión general');
    expect(navegacion.textContent).toContain('Operaciones');
    expect(navegacion.textContent).toContain('Configuración');
    expect(navegacion.querySelector('a[href="/admin/login"]')).toBeNull();
  });

  it('separa el catálogo y el sitio público de la navegación operativa', () => {
    const acciones = fixture.nativeElement.querySelector(
      'nav[aria-label="Accesos complementarios de administración"]',
    ) as HTMLElement;
    const rutas = Array.from(acciones.querySelectorAll('a')).map((enlace) =>
      enlace.getAttribute('href'),
    );

    expect(rutas).toEqual(['/catalogo', '/']);
  });

  it('mantiene el contexto de la sección en páginas de detalle', async () => {
    await router.navigateByUrl('/admin/tiendas/42');
    await fixture.whenStable();
    fixture.detectChanges();

    const enlaceTiendas = fixture.nativeElement.querySelector(
      'a[href="/admin/tiendas"]',
    ) as HTMLAnchorElement;
    const tituloActual = fixture.nativeElement.querySelector('header strong') as HTMLElement;

    expect(enlaceTiendas.getAttribute('aria-current')).toBe('page');
    expect(tituloActual.textContent?.trim()).toBe('Tiendas');
  });

  it('expone toda la navegación administrativa en el diálogo móvil', async () => {
    const botonMenu = fixture.nativeElement.querySelector(
      'button[aria-controls="menu-layout-privado"]',
    ) as HTMLButtonElement;

    botonMenu.click();
    await fixture.whenStable();

    const menu = fixture.nativeElement.querySelector(
      'aside[role="dialog"][aria-label="Navegación administrativa"]',
    ) as HTMLElement;

    expect(menu).toBeTruthy();
    expect(menu.querySelectorAll('nav[aria-label="Secciones de administración"] a')).toHaveLength(
      7,
    );
    expect(document.body.style.overflow).toBe('hidden');

    (menu.querySelector('button[aria-label="Cerrar menú"]') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(document.body.style.overflow).toBe('');
  });
});
