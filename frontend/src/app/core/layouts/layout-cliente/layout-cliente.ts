import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  EnlaceLayoutPrivado,
  LayoutPrivadoComponent,
} from '../componentes/layout-privado/layout-privado';

@Component({
  selector: 'app-layout-cliente',
  imports: [LayoutPrivadoComponent, RouterOutlet],
  templateUrl: './layout-cliente.html',
  styleUrl: './layout-cliente.css',
})
export class LayoutCliente {
  readonly enlaces: EnlaceLayoutPrivado[] = [
    {
      etiqueta: 'Resumen',
      ruta: '/cliente',
      descripcion: 'Actividad, pedidos y preferencias',
    },
    {
      etiqueta: 'Catalogo',
      ruta: '/catalogo',
      descripcion: 'Explorar regalos personalizados',
    },
    {
      etiqueta: 'Carrito',
      ruta: '/carrito',
      descripcion: 'Preparar una solicitud',
    },
  ];
}
