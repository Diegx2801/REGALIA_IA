import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  // FUNDAMENTO ANGULAR: App es el componente raiz y RouterOutlet muestra la vista activa.
  protected readonly title = signal('REGALIA');
}
