import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-hero-search',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './hero-search.html',
  styleUrl: './hero-search.css',
})
export class HeroSearchComponent {
  private readonly router = inject(Router);

  // FORMULARIO ANGULAR: captura la necesidad inicial antes de entrar al flujo IA.
  readonly searchForm = new FormGroup({
    occasion: new FormControl('Dia de la Madre', { nonNullable: true }),
    budget: new FormControl('S/ 50 - S/ 300+', { nonNullable: true }),
    date: new FormControl('', { nonNullable: true }),
    district: new FormControl('Todos', { nonNullable: true }),
  });

  submitSearch(): void {
    // QUERY PARAMS: envia los filtros en la URL para que otra vista reciba ese contexto.
    void this.router.navigate(['/pedir-con-ia'], {
      queryParams: this.searchForm.getRawValue(),
    });
  }
}
