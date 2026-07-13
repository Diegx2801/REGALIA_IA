import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EncabezadoSeccion } from '../../../../shared/ui/encabezado-seccion/encabezado-seccion';
import { EstadoPantallaComponent } from '../../../../shared/ui/estado-pantalla/estado-pantalla';
import { InsigniaUi } from '../../../../shared/ui/insignia-ui/insignia-ui';
import { SkeletonCard } from '../../../../shared/ui/skeleton-card/skeleton-card';
import { TiendaPublica } from '../../../tiendas/modelos/tienda-publica.model';

@Component({
  selector: 'app-tiendas-catalogo',
  imports: [EncabezadoSeccion, EstadoPantallaComponent, InsigniaUi, RouterLink, SkeletonCard],
  templateUrl: './tiendas-catalogo.html',
})
export class TiendasCatalogo {
  readonly tiendas = input.required<readonly TiendaPublica[]>();
  readonly cargando = input.required<boolean>();
  readonly mensajeError = input.required<string | null>();

  identificarTienda(_indice: number, tienda: TiendaPublica): number {
    return tienda.idTienda;
  }
}
