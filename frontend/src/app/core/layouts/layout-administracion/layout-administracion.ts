import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  AccionRapidaLayoutPrivado,
  EnlaceLayoutPrivado,
  LayoutPrivadoComponent,
} from '../componentes/layout-privado/layout-privado';

@Component({
  selector: 'app-layout-administracion',
  imports: [LayoutPrivadoComponent, RouterOutlet],
  templateUrl: './layout-administracion.html',
  styleUrl: './layout-administracion.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutAdministracion {
  readonly enlaces: readonly EnlaceLayoutPrivado[] = [
    {
      etiqueta: 'Resumen',
      ruta: '/admin/resumen',
      descripcion: 'Control general de plataforma',
      icono: 'resumen',
      encabezadoGrupo: 'Visión general',
    },
    {
      etiqueta: 'Usuarios',
      ruta: '/admin/usuarios',
      descripcion: 'Cuentas y estado de acceso',
      icono: 'usuarios',
      encabezadoGrupo: 'Operaciones',
    },
    {
      etiqueta: 'Vendedores',
      ruta: '/admin/vendedores',
      descripcion: 'Actividad comercial y verificación',
      icono: 'vendedores',
      patronesActivos: [/^\/admin\/vendedores(?:\/[^/]+)?$/],
    },
    {
      etiqueta: 'Tiendas',
      ruta: '/admin/tiendas',
      descripcion: 'Revisión y moderación comercial',
      icono: 'tiendas',
      patronesActivos: [/^\/admin\/tiendas(?:\/[^/]+)?$/],
    },
    {
      etiqueta: 'Pedidos',
      ruta: '/admin/pedidos',
      descripcion: 'Seguimiento operativo global',
      icono: 'pedidos',
      patronesActivos: [/^\/admin\/pedidos(?:\/[^/]+)?$/],
    },
    {
      etiqueta: 'Datos maestros',
      ruta: '/admin/datos-maestros',
      descripcion: 'Catálogos base de la plataforma',
      icono: 'datos',
      encabezadoGrupo: 'Configuración',
    },
  ];

  readonly accionesRapidas: readonly AccionRapidaLayoutPrivado[] = [
    {
      etiqueta: 'Catálogo',
      ruta: '/catalogo',
      descripcion: 'Revisar la experiencia pública',
      icono: 'catalogo',
      ariaLabel: 'Abrir el catálogo público',
      ocultaEnMovil: true,
      etiquetaDesdeSm: true,
    },
    {
      etiqueta: 'Sitio público',
      ruta: '/',
      descripcion: 'Volver al inicio de REGALIA',
      icono: 'inicio',
      ariaLabel: 'Ir al sitio público de REGALIA',
      destacada: true,
      etiquetaDesdeSm: true,
    },
  ];
}
