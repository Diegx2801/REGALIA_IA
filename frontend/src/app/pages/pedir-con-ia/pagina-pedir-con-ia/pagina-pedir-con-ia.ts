import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-pagina-pedir-con-ia',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './pagina-pedir-con-ia.html',
  styleUrl: './pagina-pedir-con-ia.css',
})
export class PaginaPedirConIa {
  private readonly router = inject(Router);

  readonly formulario = new FormGroup({
    ocasion: new FormControl('Dia de la Madre', { nonNullable: true }),
    presupuesto: new FormControl('S/ 50 - S/ 300+', { nonNullable: true }),
    distrito: new FormControl('Todos', { nonNullable: true }),
    descripcion: new FormControl('', { nonNullable: true }),
  });

  buscarOpciones(): void {
    const valores = this.formulario.getRawValue();
    const busqueda = [valores.ocasion, valores.presupuesto, valores.distrito, valores.descripcion]
      .map((valor) => valor.trim())
      .filter(Boolean)
      .join(' ');

    // La recomendacion IA futura puede reemplazar esta navegacion sin cambiar la UI publica.
    void this.router.navigate(['/catalogo'], {
      queryParams: busqueda ? { busqueda } : undefined,
    });
  }
}
