import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { BotonDirective } from '../../../shared/directivas/boton.directive';
import { SesionAutenticacionService } from '../../autenticacion/sesion-autenticacion.service';
import { CarritoCheckoutService } from '../../carrito/carrito-checkout.service';

@Component({
  selector: 'app-layout-publico',
  imports: [RouterLink, RouterOutlet, BotonDirective],
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
}
