import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SesionAutenticacionService } from '../../autenticacion/sesion-autenticacion.service';
import { CarritoCheckoutService } from '../../carrito/carrito-checkout.service';

interface EnlaceNavegacionPublica {
  readonly etiqueta: string;
  readonly ruta: string;
}

@Component({
  selector: 'app-layout-publico',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './layout-publico.html',
  styleUrl: './layout-publico.css',
})
export class LayoutPublico {
  readonly sesion = inject(SesionAutenticacionService);
  // El layout solo expone lectura; la mutacion del carrito vive en el store central.
  readonly carrito = inject(CarritoCheckoutService);
  readonly rutaPanel = computed(() => {
    const rol = this.sesion.rolActual();
    if (rol === 'ADMIN') return '/admin';
    if (rol === 'VENDEDOR') return '/vendedor';
    return '/cliente';
  });
  readonly menuMovilAbierto = signal(false);
  readonly enlacesNavegacion: readonly EnlaceNavegacionPublica[] = [
    { etiqueta: 'Inicio', ruta: '/' },
    { etiqueta: 'Pedir con IA', ruta: '/pedir-con-ia' },
    { etiqueta: 'Catálogo', ruta: '/catalogo' },
    { etiqueta: 'Vendedores', ruta: '/vendedores' },
    { etiqueta: 'Vender en REGALIA', ruta: '/vender' },
    { etiqueta: 'Cómo funciona', ruta: '/modelo' },
  ];

  private readonly router = inject(Router);

  buscarProductos(termino: string): void {
    const busqueda = termino.trim();
    void this.router.navigate(['/catalogo'], {
      queryParams: busqueda ? { busqueda } : undefined,
    });
  }

  cerrarSesion(): void {
    this.sesion.cerrarSesion();
    void this.router.navigateByUrl('/');
  }

  alternarMenuMovil(): void {
    this.menuMovilAbierto.update((abierto) => !abierto);
  }

  cerrarMenuMovil(): void {
    this.menuMovilAbierto.set(false);
  }
}
