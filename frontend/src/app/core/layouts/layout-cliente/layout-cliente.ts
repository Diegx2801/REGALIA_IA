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
      etiqueta: 'Mis pedidos',
      ruta: '/cliente/pedidos',
      descripcion: 'Historial y seguimiento',
      icono: 'pedidos',
    },
    {
      etiqueta: 'Mi perfil',
      ruta: '/cliente/perfil',
      descripcion: 'Datos y seguridad',
      icono: 'perfil',
    },
  ];
}
