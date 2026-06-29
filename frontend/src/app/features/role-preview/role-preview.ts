import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface PreviewCard {
  role: string;
  title: string;
  description: string;
  route: string;
  highlights: string[];
}

@Component({
  selector: 'app-role-preview',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './role-preview.html',
  styleUrl: './role-preview.css',
})
export class RolePreviewComponent {
  readonly previews: PreviewCard[] = [
    {
      role: 'Cliente',
      title: 'Experiencia de compra personalizada',
      description: 'Descubrimiento, solicitudes, reservas y favoritos sin mezclar información operativa.',
      route: '/vista-previa/cliente',
      highlights: ['Resumen personal', 'Solicitudes con IA', 'Reservas y seguimiento'],
    },
    {
      role: 'Vendedor',
      title: 'Centro de trabajo para emprendedores',
      description: 'Solicitudes compatibles, agenda, catálogo y salud comercial del negocio.',
      route: '/vista-previa/vendedor',
      highlights: ['Pedidos y cotizaciones', 'Agenda de entregas', 'Perfil comercial'],
    },
    {
      role: 'Administrador',
      title: 'Control ejecutivo de la plataforma',
      description: 'Indicadores de operación, confianza, usuarios y alertas prioritarias.',
      route: '/vista-previa/admin',
      highlights: ['Operación general', 'Verificación y seguridad', 'Usuarios y comisiones'],
    },
  ];
}
