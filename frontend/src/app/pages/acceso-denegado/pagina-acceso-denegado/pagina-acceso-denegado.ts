import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SesionAutenticacionService } from '../../../core/autenticacion/sesion-autenticacion.service';

@Component({
  selector: 'app-pagina-acceso-denegado',
  imports: [RouterLink],
  templateUrl: './pagina-acceso-denegado.html',
  styleUrl: './pagina-acceso-denegado.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaAccesoDenegado {
  private readonly sesion = inject(SesionAutenticacionService);

  readonly rutaPanel = computed(() => {
    if (this.sesion.tieneRol(['ADMIN'])) return '/admin/resumen';
    if (this.sesion.tieneRol(['VENDEDOR'])) return '/vendedor/resumen';
    if (this.sesion.tieneRol(['CLIENTE'])) return '/cliente';
    return '/login';
  });

  readonly etiquetaPanel = computed(() =>
    this.sesion.estaAutenticado() ? 'Ir a mi espacio' : 'Iniciar sesión',
  );
}
