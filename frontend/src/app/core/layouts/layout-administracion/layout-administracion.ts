import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  EnlaceLayoutPrivado,
  LayoutPrivadoComponent,
} from '../componentes/layout-privado/layout-privado';

@Component({
  selector: 'app-layout-administracion',
  imports: [LayoutPrivadoComponent, RouterOutlet],
  templateUrl: './layout-administracion.html',
  styleUrl: './layout-administracion.css',
})
export class LayoutAdministracion {
  readonly enlaces: EnlaceLayoutPrivado[] = [
    {
      etiqueta: 'Resumen',
      ruta: '/admin/resumen',
      descripcion: 'Control general de plataforma',
    },
    {
      etiqueta: 'Usuarios',
      ruta: '/admin/usuarios',
      descripcion: 'Cuentas y estado de acceso',
    },
    {
      etiqueta: 'Vendedores',
      ruta: '/admin/vendedores',
      descripcion: 'Actividad comercial y verificacion',
    },
    {
      etiqueta: 'Tiendas',
      ruta: '/admin/tiendas',
      descripcion: 'Revision y moderacion comercial',
    },
    {
      etiqueta: 'Pedidos',
      ruta: '/admin/pedidos',
      descripcion: 'Seguimiento operativo global',
    },
    {
      etiqueta: 'Datos maestros',
      ruta: '/admin/datos-maestros',
      descripcion: 'Catalogos base de la plataforma',
    },
    {
      etiqueta: 'Catalogo',
      ruta: '/catalogo',
      descripcion: 'Auditar experiencia publica',
    },
    {
      etiqueta: 'Login admin',
      ruta: '/admin/login',
      descripcion: 'Cambiar sesion administrativa',
    },
  ];
}
