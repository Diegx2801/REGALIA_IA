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
      ruta: '/vendedor',
      descripcion: 'Pedidos recibidos y estado comercial',
    },
    {
      etiqueta: 'Catalogo publico',
      ruta: '/catalogo',
      descripcion: 'Revisar como se ven tus productos',
    },
    {
      etiqueta: 'Inicio',
      ruta: '/',
      descripcion: 'Volver a la experiencia publica',
    },
  ];
}
