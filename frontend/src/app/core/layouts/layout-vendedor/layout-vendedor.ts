import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  EnlaceLayoutPrivado,
  LayoutPrivadoComponent,
} from '../componentes/layout-privado/layout-privado';

@Component({
  selector: 'app-layout-vendedor',
  imports: [LayoutPrivadoComponent, RouterOutlet],
  templateUrl: './layout-vendedor.html',
  styleUrl: './layout-vendedor.css',
})
export class LayoutVendedor {
  readonly enlaces: EnlaceLayoutPrivado[] = [
    {
      etiqueta: 'Resumen',
      ruta: '/vendedor/resumen',
      descripcion: 'Pedidos recibidos y estado comercial',
      icono: 'resumen',
    },
    {
      etiqueta: 'Tiendas',
      ruta: '/vendedor/tiendas',
      descripcion: 'Gestionar presencia comercial',
      icono: 'tiendas',
    },
    {
      etiqueta: 'Pedidos',
      ruta: '/vendedor/pedidos',
      descripcion: 'Solicitudes y pagos recibidos',
      icono: 'pedidos',
    },
  ];
}
