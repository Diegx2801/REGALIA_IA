import { Component, computed, DestroyRef, inject, input, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

export type TipoCampoTexto = 'text' | 'email' | 'password' | 'search' | 'tel' | 'date' | 'number';

@Component({
  selector: 'app-campo-texto',
  imports: [ReactiveFormsModule],
  templateUrl: './campo-texto.html',
  styleUrl: '../formulario-compartido.css',
  host: {
    '[attr.id]': 'null',
  },
})
export class CampoTexto implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly revisionControl = signal(0);

  readonly id = input.required<string>();
  readonly etiqueta = input.required<string>();
  readonly control = input.required<FormControl<string>>();
  readonly tipo = input<TipoCampoTexto>('text');
  readonly placeholder = input('');
  readonly autocomplete = input<string | null>(null);
  readonly maximoCaracteres = input<number | null>(null);
  readonly ayuda = input<string | null>(null);
  readonly mensajeError = input('Revisa este campo.');

  readonly debeMostrarError = computed(() => {
    this.revisionControl();
    const control = this.control();
    return control.invalid && (control.touched || control.dirty);
  });

  readonly idAyuda = computed(() => `${this.id()}-ayuda`);
  readonly idError = computed(() => `${this.id()}-error`);
  readonly ariaDescribedBy = computed(() => {
    const referencias = [
      this.ayuda() ? this.idAyuda() : null,
      this.debeMostrarError() ? this.idError() : null,
    ];
    return referencias.filter(Boolean).join(' ') || null;
  });

  ngOnInit(): void {
    this.control()
      .events.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.revisionControl.update((revision) => revision + 1));
  }
}
