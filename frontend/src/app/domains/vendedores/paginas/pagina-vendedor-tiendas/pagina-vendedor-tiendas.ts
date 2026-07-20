import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BotonDirective } from '../../../../shared/directivas/boton.directive';
import { confirmarAccionCritica } from '../../../../shared/utilidades/confirmar-accion.util';
import { DialogoUi } from '../../../../shared/ui/dialogo-ui/dialogo-ui';
import { EstadoPantallaComponent } from '../../../../shared/ui/estado-pantalla/estado-pantalla';
import { CampoTexto } from '../../../../shared/ui/formularios/campo-texto/campo-texto';
import { CampoTextarea } from '../../../../shared/ui/formularios/campo-textarea/campo-textarea';
import { InsigniaUi, VarianteInsignia } from '../../../../shared/ui/insignia-ui/insignia-ui';
import { VendedorPanelStore } from '../../estado/vendedor-panel.store';
import { TiendaVendedor } from '../../modelos/vendedor.model';

@Component({
  selector: 'app-pagina-vendedor-tiendas',
  imports: [
    ReactiveFormsModule,
    BotonDirective,
    CampoTexto,
    CampoTextarea,
    DialogoUi,
    EstadoPantallaComponent,
    InsigniaUi,
  ],
  templateUrl: './pagina-vendedor-tiendas.html',
  styleUrl: './pagina-vendedor-tiendas.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaVendedorTiendas implements OnInit {
  readonly store = inject(VendedorPanelStore);
  private readonly router = inject(Router);
  private readonly elementoFormulario =
    viewChild<ElementRef<HTMLFormElement>>('formularioTiendaUi');

  readonly idTiendaEditando = signal<number | null>(null);
  readonly mostrandoSelectorRubros = signal(false);
  readonly idsRubrosTemporales = signal<number[]>([]);
  readonly tiendaEnFoco = computed(() => this.store.tiendas()[0] ?? null);
  readonly mostrandoFormulario = computed(
    () => this.idTiendaEditando() !== null || this.store.tiendas().length === 0,
  );

  readonly formularioTienda = new FormGroup({
    nombre: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(150)],
    }),
    descripcion: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(1000)],
    }),
    direccionReferencia: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(255)],
    }),
    idsRubros: new FormControl<number[]>([], {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  ngOnInit(): void {
    this.store.cargarContexto();
  }

  @HostListener('window:beforeunload', ['$event'])
  advertirCambiosAntesDeCerrar(evento: BeforeUnloadEvent): void {
    if (!this.hayCambiosPendientes()) return;
    evento.preventDefault();
    evento.returnValue = '';
  }

  confirmarSalida(): boolean {
    if (!this.hayCambiosPendientes()) return true;
    return window.confirm(
      'Tienes cambios sin guardar en la tienda. Si sales ahora, se perderán. ¿Deseas continuar?',
    );
  }

  guardarTienda(): void {
    this.store.limpiarMensajes();

    if (this.formularioTienda.invalid) {
      this.formularioTienda.markAllAsTouched();
      this.enfocarPrimerCampoInvalido();
      return;
    }

    const valor = this.formularioTienda.getRawValue();
    if (valor.idsRubros.length === 0) return;

    const idTienda = this.idTiendaEditando();
    const solicitud = {
      nombre: valor.nombre.trim(),
      descripcion: valor.descripcion.trim() || null,
      direccionReferencia: valor.direccionReferencia.trim() || null,
      idDocumentoFiscal:
        idTienda === null
          ? null
          : (this.store.tiendas().find((tienda) => tienda.idTienda === idTienda)
              ?.idDocumentoFiscal ?? null),
      idsRubros: valor.idsRubros,
    };

    if (idTienda === null) {
      this.store.crearTienda(solicitud, () => this.formularioTienda.markAsPristine());
    } else {
      this.store.actualizarTienda(idTienda, solicitud, () =>
        this.formularioTienda.markAsPristine(),
      );
    }
  }

  editarTienda(tienda: TiendaVendedor): void {
    this.idTiendaEditando.set(tienda.idTienda);
    this.formularioTienda.reset({
      nombre: tienda.nombre,
      descripcion:
        tienda.descripcion === 'Sin descripcion comercial registrada.' ? '' : tienda.descripcion,
      direccionReferencia:
        tienda.direccionReferencia === 'Direccion pendiente' ? '' : tienda.direccionReferencia,
      idsRubros: tienda.rubros.map((rubro) => rubro.idRubro),
    });
  }

  cancelarEdicion(confirmarDescarte = true): void {
    if (this.store.guardandoTienda()) return;
    if (
      confirmarDescarte &&
      this.hayCambiosPendientes() &&
      !window.confirm('Los cambios de esta tienda no se guardarán. ¿Deseas descartarlos?')
    ) {
      return;
    }

    this.idTiendaEditando.set(null);
    this.formularioTienda.reset({
      nombre: '',
      descripcion: '',
      direccionReferencia: '',
      idsRubros: [],
    });
  }

  abrirSelectorRubros(): void {
    this.idsRubrosTemporales.set([...this.formularioTienda.controls.idsRubros.value]);
    this.mostrandoSelectorRubros.set(true);
  }

  cerrarSelectorRubros(): void {
    this.mostrandoSelectorRubros.set(false);
    this.idsRubrosTemporales.set([]);
  }

  aplicarRubrosSeleccionados(): void {
    const control = this.formularioTienda.controls.idsRubros;
    control.setValue(this.idsRubrosTemporales());
    control.markAsTouched();
    control.markAsDirty();
    this.cerrarSelectorRubros();
  }

  alternarRubroTemporal(idRubro: number, evento: Event): void {
    const seleccionado = (evento.target as HTMLInputElement).checked;
    const idsActuales = this.idsRubrosTemporales();

    this.idsRubrosTemporales.set(
      seleccionado
        ? [...idsActuales, idRubro]
        : idsActuales.filter((idActual) => idActual !== idRubro),
    );
  }

  rubroTemporalSeleccionado(idRubro: number): boolean {
    return this.idsRubrosTemporales().includes(idRubro);
  }

  resumenRubrosSeleccionados(): string {
    const idsSeleccionados = this.formularioTienda.controls.idsRubros.value;
    const nombres = this.store
      .rubros()
      .filter((rubro) => idsSeleccionados.includes(rubro.idRubro))
      .map((rubro) => rubro.nombre);

    return nombres.length > 0 ? nombres.join(', ') : 'Aún no seleccionaste rubros.';
  }

  describirRubros(tienda: TiendaVendedor): string {
    return tienda.rubros.length > 0
      ? tienda.rubros.map((rubro) => rubro.nombre).join(', ')
      : 'Rubro pendiente';
  }

  eliminarTienda(tienda: TiendaVendedor): void {
    if (!confirmarAccionCritica(`Vas a eliminar la tienda "${tienda.nombre}".`)) return;

    if (this.idTiendaEditando() === tienda.idTienda) this.cancelarEdicion(false);
    this.store.eliminarTienda(tienda.idTienda);
  }

  abrirCentroTienda(idTienda: number): void {
    void this.router.navigate(['/vendedor/tiendas', idTienda]);
  }

  estadoComercial(estado: string): string {
    const etiquetas: Record<string, string> = {
      PENDIENTE: 'En revisión',
      APROBADA: 'Activa en REGALIA',
      OBSERVADA: 'Requiere atención',
      RECHAZADA: 'No aprobada',
    };

    return etiquetas[estado] ?? 'En revisión';
  }

  varianteEstadoComercial(estado: string): VarianteInsignia {
    const variantes: Record<string, VarianteInsignia> = {
      PENDIENTE: 'advertencia',
      APROBADA: 'exito',
      OBSERVADA: 'advertencia',
      RECHAZADA: 'error',
    };

    return variantes[estado] ?? 'neutral';
  }

  inicialesTienda(nombre: string): string {
    const iniciales = nombre
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((palabra) => palabra.charAt(0))
      .join('');

    return iniciales.toLocaleUpperCase('es-PE') || 'RG';
  }

  tituloSiguientePaso(estado: string): string {
    const titulos: Record<string, string> = {
      PENDIENTE: 'Tu tienda está en revisión',
      APROBADA: 'Tu vitrina ya está publicada',
      OBSERVADA: 'Revisa tu información comercial',
      RECHAZADA: 'Actualiza los datos de tu tienda',
    };

    return titulos[estado] ?? 'Mantén tu información al día';
  }

  descripcionSiguientePaso(estado: string): string {
    const descripciones: Record<string, string> = {
      PENDIENTE:
        'Puedes preparar el catálogo desde tu centro mientras validamos la información comercial.',
      APROBADA: 'Administra productos, stock y pedidos desde el centro privado de tu tienda.',
      OBSERVADA:
        'Verifica que el nombre, la ubicación, la descripción y los rubros estén completos y vigentes.',
      RECHAZADA:
        'Corrige la información comercial disponible antes de solicitar una nueva revisión.',
    };

    return descripciones[estado] ?? 'Revisa periódicamente los datos visibles para tus clientes.';
  }

  campoTieneError(campo: keyof typeof this.formularioTienda.controls): boolean {
    const control = this.formularioTienda.controls[campo];
    return control.invalid && (control.touched || control.dirty);
  }

  private enfocarPrimerCampoInvalido(): void {
    queueMicrotask(() => {
      const formulario = this.elementoFormulario()?.nativeElement;
      const primerCampoInvalido = formulario?.querySelector<HTMLElement>(
        '[aria-invalid="true"], .vendedor-tiendas__selector-rubros--error button',
      );
      primerCampoInvalido?.focus();
    });
  }

  private hayCambiosPendientes(): boolean {
    return this.mostrandoFormulario() && this.formularioTienda.dirty;
  }
}
