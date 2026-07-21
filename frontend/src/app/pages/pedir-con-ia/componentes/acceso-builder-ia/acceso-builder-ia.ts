import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-acceso-builder-ia',
  imports: [RouterLink],
  templateUrl: './acceso-builder-ia.html',
  styleUrl: './acceso-builder-ia.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccesoBuilderIa {}
