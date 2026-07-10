import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BotonDirective } from '../../../shared/directivas/boton.directive';

@Component({
  selector: 'app-pagina-inicio',
  imports: [RouterLink, BotonDirective],
  templateUrl: './pagina-inicio.html',
  styleUrl: './pagina-inicio.css',
})
export class PaginaInicio {}
