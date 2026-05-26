/**
 * =========================================================================
 * COMPONENTE: HeroConsoleComponent
 * DESCRIPCIÓN: Simulador interactivo de validación de componentes por IA.
 * =========================================================================
 */
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-hero-console',
  standalone: true,
  imports: [],
  templateUrl: './hero-console.html',
  styleUrl: './hero-console.css',
})
export class HeroConsoleComponent {
  // Uso de Signals para reactividad moderna en el renderizado
  presupuestoEstimado = signal<number>(4470);
  estadoConsola = signal<string>('En Línea');
}
