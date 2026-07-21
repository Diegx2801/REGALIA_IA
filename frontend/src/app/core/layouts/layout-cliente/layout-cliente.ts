import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CarritoCheckoutService } from '../../carrito/carrito-checkout.service';
import {
  AccionRapidaLayoutPrivado,
  EnlaceLayoutPrivado,
  LayoutPrivadoComponent,
} from '../componentes/layout-privado/layout-privado';

@Component({
  selector: 'app-layout-cliente',
  imports: [LayoutPrivadoComponent, RouterOutlet],
  templateUrl: './layout-cliente.html',
  styleUrl: './layout-cliente.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutCliente {
  private readonly carrito = inject(CarritoCheckoutService);

  readonly enlaces: readonly EnlaceLayoutPrivado[] = [
    {
      etiqueta: 'Mis pedidos',
      ruta: '/cliente/pedidos',
      descripcion: 'Compras y seguimiento',
      icono: 'pedidos',
      patronesActivos: [/^\/cliente\/pedidos(?:\/\d+)?$/],
    },
    {
      etiqueta: 'Mi perfil',
      ruta: '/cliente/perfil',
      descripcion: 'Cuenta, acceso y seguridad',
      icono: 'perfil',
      patronesActivos: [/^\/cliente\/perfil$/],
    },
  ];

  readonly accionesRapidas = computed<readonly AccionRapidaLayoutPrivado[]>(() => {
    const cantidadItems = this.carrito.cantidadItems();
    const insignia = cantidadItems > 99 ? '99+' : cantidadItems || null;

    return [
      {
        etiqueta: 'Explorar',
        ruta: '/catalogo',
        descripcion: 'Descubrir regalos',
        icono: 'catalogo',
        ariaLabel: 'Explorar el catálogo de regalos',
      },
      {
        etiqueta: 'Carrito',
        ruta: '/carrito',
        descripcion: cantidadItems
          ? `${cantidadItems} ${cantidadItems === 1 ? 'producto' : 'productos'}`
          : 'Preparar una compra',
        icono: 'carrito',
        ariaLabel: cantidadItems
          ? `Abrir carrito, ${cantidadItems} ${cantidadItems === 1 ? 'producto' : 'productos'}`
          : 'Abrir carrito vacío',
        insignia,
        destacada: true,
      },
    ];
  });
}
