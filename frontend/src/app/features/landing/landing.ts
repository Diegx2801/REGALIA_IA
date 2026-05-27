import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class LandingComponent {
  readonly occasions = [
    'Cumpleanos',
    'Dia de la Madre',
    'Aniversarios',
    'Graduacion',
    'Condolencias',
    'Mas categorias',
  ];

  readonly featured = [
    {
      title: 'Box mama edicion especial',
      provider: 'Caja Bonita',
      price: 'Desde S/ 129',
      rating: '4.9',
      tone: 'gift',
    },
    {
      title: 'Arreglo floral radiante',
      provider: 'Floralia Studio',
      price: 'Desde S/ 99',
      rating: '4.8',
      tone: 'flowers',
    },
    {
      title: 'Torta eres unica',
      provider: 'Dulce Detalle',
      price: 'Desde S/ 85',
      rating: '4.9',
      tone: 'cake',
    },
    {
      title: 'Detalle relax personalizado',
      provider: 'Bienestar Natural',
      price: 'Desde S/ 119',
      rating: '4.8',
      tone: 'premium',
    },
  ];

  trackText(index: number, value: string): string {
    return `${index}-${value}`;
  }

  trackFeatured(index: number, item: { title: string }): string {
    return `${index}-${item.title}`;
  }
}
