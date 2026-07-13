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
      ruta: '/cliente/resumen',
      descripcion: 'Actividad, pedidos y preferencias',
    },
    {
      etiqueta: 'Perfil',
      ruta: '/cliente/perfil',
      descripcion: 'Datos personales y contacto',
    },
    {
      etiqueta: 'Pedidos',
      ruta: '/cliente/pedidos',
      descripcion: 'Historial y seguimiento',
    },
    {
      etiqueta: 'Pagos',
      ruta: '/cliente/pagos',
      descripcion: 'Saldos pendientes y pagos',
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
