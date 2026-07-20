import { Component, computed, DestroyRef, inject, input, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-campo-textarea',
  imports: [ReactiveFormsModule],
  templateUrl: './campo-textarea.html',
  styleUrl: '../formulario-compartido.css',
  host: {
    '[attr.id]': 'null',
  },
})
export class CampoTextarea implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly revisionControl = signal(0);

  readonly id = input.required<string>();
  readonly etiqueta = input.required<string>();
  readonly control = input.required<FormControl<string>>();
  readonly placeholder = input('');
  readonly filas = input(4);
  readonly maximoCaracteres = input<number | null>(null);
  readonly ayuda = input<string | null>(null);
  readonly mensajeError = input('Revisa este campo.');

  readonly debeMostrarError = computed(() => {
    this.revisionControl();
    const control = this.control();
    return control.invalid && (control.touched || control.dirty);
  });

  readonly caracteresUsados = computed(() => {
    this.revisionControl();
    return this.control().value.length;
  });

  readonly idAyuda = computed(() => `${this.id()}-ayuda`);
  readonly idError = computed(() => `${this.id()}-error`);
  readonly idContador = computed(() => `${this.id()}-contador`);

  readonly ariaDescribedBy = computed(() => {
    const referencias = [
      this.ayuda() ? this.idAyuda() : null,
      this.maximoCaracteres() ? this.idContador() : null,
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
