import { DatePipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';
import { obtenerMensajeErrorUsuario } from '../../../../core/http/modelos/error-api.model';
import { BotonDirective } from '../../../../shared/directivas/boton.directive';
import {
  CampoFormularioDirective,
  ErrorCampoDirective,
  FormularioPanelDirective,
} from '../../../../shared/directivas/formulario-panel.directive';
import { EstadoPantallaComponent } from '../../../../shared/ui/estado-pantalla/estado-pantalla';
import { TipoDocumentoApiService } from '../../../datos-maestros/acceso-datos/tipo-documento-api.service';
import { TipoDocumento } from '../../../datos-maestros/modelos/tipo-documento.model';
import { UsuarioDocumentoApiService } from '../../acceso-datos/usuario-documento-api.service';
import {
  ConsultaRuc,
  EstadoVerificacionDocumento,
  UsuarioDocumento,
} from '../../modelos/usuario-documento.model';

@Component({
  selector: 'app-panel-documentos-usuario',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    BotonDirective,
    CampoFormularioDirective,
    ErrorCampoDirective,
    FormularioPanelDirective,
    EstadoPantallaComponent,
  ],
  templateUrl: './panel-documentos-usuario.html',
  styleUrl: './panel-documentos-usuario.css',
})
export class PanelDocumentosUsuario implements OnInit {
  private readonly documentosApi = inject(UsuarioDocumentoApiService);
  private readonly tiposDocumentoApi = inject(TipoDocumentoApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly documentos = signal<UsuarioDocumento[]>([]);
  readonly tiposDocumento = signal<TipoDocumento[]>([]);
  private readonly idTipoDocumentoSeleccionado = signal<number | null>(null);
  readonly consultaRuc = signal<ConsultaRuc | null>(null);
  readonly cargando = signal(true);
  readonly consultandoRuc = signal(false);
  readonly registrando = signal(false);
  readonly mensajeErrorCarga = signal<string | null>(null);
  readonly mensajeErrorOperacion = signal<string | null>(null);
  readonly mensajeExito = signal<string | null>(null);

  readonly formulario = new FormGroup({
    idTipoDocumento: new FormControl<number | null>(null, {
      validators: [Validators.required],
    }),
    numeroDocumento: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(30)],
    }),
  });

  readonly tiposDisponibles = computed(() =>
    this.tiposDocumento().filter(
      (tipo) =>
        !this.documentos().some(
          (documento) =>
            documento.idTipoDocumento === tipo.idTipoDocumento &&
            (documento.estado || tipo.abreviatura === 'RUC'),
        ),
    ),
  );

  readonly tipoSeleccionado = computed(() => {
    const idTipoDocumento = this.idTipoDocumentoSeleccionado();
    return this.tiposDocumento().find((tipo) => tipo.idTipoDocumento === idTipoDocumento) ?? null;
  });

  readonly esRuc = computed(() => this.tipoSeleccionado()?.abreviatura === 'RUC');

  readonly consultaRucVigente = computed(() => {
    const consulta = this.consultaRuc();
    return consulta?.ruc === this.formulario.controls.numeroDocumento.value.trim()
      ? consulta
      : null;
  });

  ngOnInit(): void {
    this.observarCambiosFormulario();
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando.set(true);
    this.mensajeErrorCarga.set(null);

    forkJoin({
      documentos: this.documentosApi.obtenerDocumentos(),
      tiposDocumento: this.tiposDocumentoApi.obtenerTiposDocumento(),
    })
      .pipe(
        finalize(() => this.cargando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ documentos, tiposDocumento }) => {
          this.documentos.set(documentos);
          this.tiposDocumento.set(tiposDocumento);
          this.seleccionarPrimerTipoDisponible();
        },
        error: (error: unknown) =>
          this.mensajeErrorCarga.set(
            obtenerMensajeErrorUsuario(error, 'No pudimos cargar tus documentos.'),
          ),
      });
  }

  procesarFormulario(): void {
    this.limpiarMensajesOperacion();

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    if (this.esRuc()) {
      this.consultarRuc();
      return;
    }

    this.registrarDocumentoGeneral();
  }

  registrarRucConsultado(): void {
    const consulta = this.consultaRucVigente();
    if (!consulta || this.registrando()) return;

    this.registrando.set(true);
    this.limpiarMensajesOperacion();

    this.documentosApi
      .registrarRuc(consulta.ruc)
      .pipe(
        finalize(() => this.registrando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (documento) => this.registrarDocumentoEnVista(documento),
        error: (error: unknown) => this.registrarErrorOperacion(error),
      });
  }

  campoTieneError(campo: keyof typeof this.formulario.controls): boolean {
    const control = this.formulario.controls[campo];
    return control.invalid && (control.touched || control.dirty);
  }

  etiquetaEstado(estado: EstadoVerificacionDocumento): string {
    const etiquetas: Record<EstadoVerificacionDocumento, string> = {
      PENDIENTE: 'Pendiente de revisión',
      VERIFICADO: 'Verificado',
      OBSERVADO: 'Observado',
      RECHAZADO: 'Rechazado',
      DESCONOCIDO: 'Estado no disponible',
    };

    return etiquetas[estado];
  }

  descripcionLongitudDocumento(): string {
    const tipo = this.tipoSeleccionado();
    if (!tipo) return 'Selecciona un tipo de documento.';

    return tipo.longitudMinima === tipo.longitudMaxima
      ? `Debe contener exactamente ${tipo.longitudMinima} caracteres.`
      : `Debe contener entre ${tipo.longitudMinima} y ${tipo.longitudMaxima} caracteres.`;
  }

  private consultarRuc(): void {
    const numeroRuc = this.formulario.controls.numeroDocumento.value.trim();
    this.consultandoRuc.set(true);
    this.consultaRuc.set(null);

    this.documentosApi
      .consultarRuc(numeroRuc)
      .pipe(
        finalize(() => this.consultandoRuc.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (consulta) => this.consultaRuc.set(consulta),
        error: (error: unknown) => this.registrarErrorOperacion(error),
      });
  }

  private registrarDocumentoGeneral(): void {
    const valor = this.formulario.getRawValue();
    if (valor.idTipoDocumento === null) return;

    this.registrando.set(true);

    this.documentosApi
      .registrarDocumento({
        idTipoDocumento: valor.idTipoDocumento,
        numeroDocumento: valor.numeroDocumento,
      })
      .pipe(
        finalize(() => this.registrando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (documento) => this.registrarDocumentoEnVista(documento),
        error: (error: unknown) => this.registrarErrorOperacion(error),
      });
  }

  private registrarDocumentoEnVista(documento: UsuarioDocumento): void {
    this.documentos.update((documentos) => [
      ...documentos.filter((actual) => actual.idUsuarioDocumento !== documento.idUsuarioDocumento),
      documento,
    ]);
    this.formulario.controls.numeroDocumento.reset('');
    this.consultaRuc.set(null);
    this.seleccionarPrimerTipoDisponible();
    this.mensajeExito.set('Documento registrado y enviado a revisión correctamente.');
  }

  private observarCambiosFormulario(): void {
    this.formulario.controls.idTipoDocumento.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((idTipoDocumento) => {
        this.idTipoDocumentoSeleccionado.set(idTipoDocumento);
        this.configurarValidadoresNumeroDocumento();
        this.formulario.controls.numeroDocumento.reset('');
        this.limpiarMensajesOperacion();
      });

    this.formulario.controls.numeroDocumento.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.consultaRuc.set(null);
        this.mensajeErrorOperacion.set(null);
        this.mensajeExito.set(null);
      });
  }

  private configurarValidadoresNumeroDocumento(): void {
    const tipo = this.tipoSeleccionado();
    const validadores = [Validators.required, Validators.maxLength(30)];

    if (tipo) {
      validadores.push(
        Validators.minLength(tipo.longitudMinima),
        Validators.maxLength(tipo.longitudMaxima),
      );
    }

    if (tipo?.abreviatura === 'RUC') {
      validadores.push(Validators.pattern(/^\d{11}$/));
    }

    this.formulario.controls.numeroDocumento.setValidators(validadores);
    this.formulario.controls.numeroDocumento.updateValueAndValidity({ emitEvent: false });
  }

  private seleccionarPrimerTipoDisponible(): void {
    const idTipoActual = this.formulario.controls.idTipoDocumento.value;
    const tipoActualDisponible = this.tiposDisponibles().some(
      (tipo) => tipo.idTipoDocumento === idTipoActual,
    );

    this.formulario.controls.idTipoDocumento.setValue(
      tipoActualDisponible ? idTipoActual : (this.tiposDisponibles()[0]?.idTipoDocumento ?? null),
    );
  }

  private registrarErrorOperacion(error: unknown): void {
    this.mensajeErrorOperacion.set(
      obtenerMensajeErrorUsuario(error, 'No pudimos procesar el documento.'),
    );
    this.mensajeExito.set(null);
  }

  private limpiarMensajesOperacion(): void {
    this.mensajeErrorOperacion.set(null);
    this.mensajeExito.set(null);
    this.consultaRuc.set(null);
  }
}
