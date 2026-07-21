import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  OnChanges,
  output,
  SimpleChanges,
} from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { BotonDirective } from '../../../../shared/directivas/boton.directive';
import {
  CampoSelect,
  OpcionCampoSelect,
} from '../../../../shared/ui/formularios/campo-select/campo-select';
import { CampoTextarea } from '../../../../shared/ui/formularios/campo-textarea/campo-textarea';
import { CampoTexto } from '../../../../shared/ui/formularios/campo-texto/campo-texto';
import { GrupoFormulario } from '../../../../shared/ui/formularios/grupo-formulario/grupo-formulario';
import {
  CategoriaDocumentoAdmin,
  DatoMaestroAdmin,
  obtenerConfiguracionDatoMaestro,
  SolicitudGuardarDatoMaestro,
  TipoDatoMaestroAdmin,
} from '../../modelos/dato-maestro-admin.model';

@Component({
  selector: 'app-formulario-dato-maestro',
  imports: [
    ReactiveFormsModule,
    BotonDirective,
    CampoSelect,
    CampoTextarea,
    CampoTexto,
    GrupoFormulario,
  ],
  templateUrl: './formulario-dato-maestro.html',
  styleUrl: './formulario-dato-maestro.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormularioDatoMaestro implements OnChanges {
  private readonly elemento: ElementRef<HTMLElement> = inject(ElementRef);

  readonly tipo = input<TipoDatoMaestroAdmin>('RUBRO');
  readonly dato = input<DatoMaestroAdmin | null>(null);
  readonly categoriasDocumento = input<readonly CategoriaDocumentoAdmin[]>([]);
  readonly procesando = input(false);

  readonly guardar = output<SolicitudGuardarDatoMaestro>();
  readonly cancelar = output<void>();

  readonly formulario = new FormGroup(
    {
      nombre: new FormControl('', { nonNullable: true }),
      descripcion: new FormControl('', { nonNullable: true }),
      abreviatura: new FormControl('', { nonNullable: true }),
      longitudMinima: new FormControl('', { nonNullable: true }),
      longitudMaxima: new FormControl('', { nonNullable: true }),
      idCategoriaDocumento: new FormControl('', { nonNullable: true }),
    },
    { validators: this.validarRangoDocumento() },
  );

  get configuracion() {
    return obtenerConfiguracionDatoMaestro(this.tipo());
  }

  get opcionesCategoriasDocumento(): readonly OpcionCampoSelect[] {
    return [
      { valor: '', etiqueta: 'Selecciona una categoría' },
      ...this.categoriasDocumento().map((categoria) => ({
        valor: String(categoria.id),
        etiqueta: categoria.nombre,
      })),
    ];
  }

  ngOnChanges(cambios: SimpleChanges): void {
    if (cambios['tipo'] || cambios['dato']) {
      this.configurarFormulario();
    }
  }

  enviar(): void {
    this.formulario.markAllAsTouched();
    if (this.formulario.invalid || this.procesando()) {
      queueMicrotask(() =>
        this.elemento.nativeElement
          .querySelector<HTMLElement>('input.ng-invalid, select.ng-invalid, textarea.ng-invalid')
          ?.focus(),
      );
      return;
    }

    const valores = this.formulario.getRawValue();
    this.guardar.emit({
      tipo: this.tipo(),
      id: this.dato()?.id ?? null,
      valores: {
        nombre: valores.nombre.trim(),
        descripcion: valores.descripcion.trim(),
        abreviatura: valores.abreviatura.trim().toUpperCase(),
        longitudMinima: this.convertirNumero(valores.longitudMinima),
        longitudMaxima: this.convertirNumero(valores.longitudMaxima),
        idCategoriaDocumento: this.convertirNumero(valores.idCategoriaDocumento),
      },
    });
  }

  private configurarFormulario(): void {
    const dato = this.dato();
    const controles = this.formulario.controls;

    Object.values(controles).forEach((control) => control.clearValidators());
    controles.nombre.setValidators([
      Validators.required,
      Validators.maxLength(this.tipo() === 'TIPO_DOCUMENTO' ? 80 : 100),
    ]);

    if (this.tipo() === 'RUBRO') {
      controles.descripcion.setValidators(Validators.maxLength(255));
    }

    if (this.tipo() === 'TIPO_PAGO') {
      controles.descripcion.setValidators(Validators.maxLength(500));
    }

    if (this.tipo() === 'TIPO_DOCUMENTO') {
      controles.abreviatura.setValidators([Validators.required, Validators.maxLength(10)]);
      controles.longitudMinima.setValidators([
        Validators.required,
        Validators.pattern(/^[1-9]\d*$/),
      ]);
      controles.longitudMaxima.setValidators([
        Validators.required,
        Validators.pattern(/^[1-9]\d*$/),
      ]);
      controles.idCategoriaDocumento.setValidators(Validators.required);
    }

    this.formulario.reset(
      {
        nombre: dato?.nombre ?? '',
        descripcion:
          dato && (dato.tipo === 'RUBRO' || dato.tipo === 'TIPO_PAGO') ? dato.descripcion : '',
        abreviatura: dato?.abreviatura ?? '',
        longitudMinima: dato?.longitudMinima ? String(dato.longitudMinima) : '',
        longitudMaxima: dato?.longitudMaxima ? String(dato.longitudMaxima) : '',
        idCategoriaDocumento: dato?.idCategoriaDocumento ? String(dato.idCategoriaDocumento) : '',
      },
      { emitEvent: false },
    );

    Object.values(controles).forEach((control) =>
      control.updateValueAndValidity({ emitEvent: false }),
    );
    this.formulario.updateValueAndValidity({ emitEvent: false });
  }

  private validarRangoDocumento(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (this.tipo() !== 'TIPO_DOCUMENTO') return null;

      const minimo = this.convertirNumero(control.get('longitudMinima')?.value);
      const maximo = this.convertirNumero(control.get('longitudMaxima')?.value);
      if (minimo === null || maximo === null || minimo <= maximo) return null;

      return { rangoDocumentoInvalido: true };
    };
  }

  private convertirNumero(valor: unknown): number | null {
    if (typeof valor !== 'string' || !valor.trim()) return null;
    const numero = Number(valor);
    return Number.isInteger(numero) ? numero : null;
  }
}
