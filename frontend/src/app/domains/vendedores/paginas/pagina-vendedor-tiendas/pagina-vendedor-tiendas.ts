import { Component, HostListener, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { confirmarAccionCritica } from '../../../../shared/utilidades/confirmar-accion.util';
import { BotonDirective } from '../../../../shared/directivas/boton.directive';
import {
  CampoFormularioDirective,
  ErrorCampoDirective,
  FormularioPanelDirective,
} from '../../../../shared/directivas/formulario-panel.directive';
import { EstadoPantallaComponent } from '../../../../shared/ui/estado-pantalla/estado-pantalla';
import { FilaPanelComponent } from '../../../../shared/ui/fila-panel/fila-panel';
import { ListaPanelComponent } from '../../../../shared/ui/lista-panel/lista-panel';
import { TiendaVendedor } from '../../modelos/vendedor.model';
import { VendedorPanelStore } from '../../estado/vendedor-panel.store';

@Component({
  selector: 'app-pagina-vendedor-tiendas',
  imports: [
    ReactiveFormsModule,
    BotonDirective,
    CampoFormularioDirective,
    ErrorCampoDirective,
    FormularioPanelDirective,
    EstadoPantallaComponent,
    FilaPanelComponent,
    ListaPanelComponent,
  ],
  templateUrl: './pagina-vendedor-tiendas.html',
  styleUrl: './pagina-vendedor-tiendas.css',
})
export class PaginaVendedorTiendas implements OnInit {
  readonly store = inject(VendedorPanelStore);
  private readonly router = inject(Router);
  readonly idTiendaEditando = signal<number | null>(null);
  readonly mostrandoSelectorRubros = signal(false);
  readonly idsRubrosTemporales = signal<number[]>([]);

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
    this.store.cargarPanel();
  }

  guardarTienda(): void {
    this.store.limpiarMensajes();

    if (this.formularioTienda.invalid) {
      this.formularioTienda.markAllAsTouched();
      return;
    }

    const valor = this.formularioTienda.getRawValue();
    if (valor.idsRubros.length === 0) return;

    const idTienda = this.idTiendaEditando();
    const solicitud = {
      nombre: valor.nombre.trim(),
      descripcion: valor.descripcion.trim() || null,
      direccionReferencia: valor.direccionReferencia.trim() || null,
      idDocumentoFiscal: idTienda === null
        ? null
        : this.store.tiendas().find((tienda) => tienda.idTienda === idTienda)?.idDocumentoFiscal ?? null,
      idsRubros: valor.idsRubros,
    };
    if (idTienda === null) {
      this.store.crearTienda(solicitud);
    } else {
      this.store.actualizarTienda(idTienda, solicitud);
    }
  }

  editarTienda(tienda: TiendaVendedor): void {
    // La lectura individual revalida propiedad y evita editar datos potencialmente obsoletos.
    this.store.cargarTienda(tienda.idTienda);
    this.idTiendaEditando.set(tienda.idTienda);
    this.formularioTienda.reset({
      nombre: tienda.nombre,
      descripcion: tienda.descripcion === 'Sin descripcion comercial registrada.' ? '' : tienda.descripcion,
      direccionReferencia: tienda.direccionReferencia === 'Direccion pendiente' ? '' : tienda.direccionReferencia,
      idsRubros: tienda.rubros.map((rubro) => rubro.idRubro),
    });
  }

  cancelarEdicion(): void {
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
        : idsActuales.filter((idActual) => idActual !== idRubro)
    );
  }

  rubroTemporalSeleccionado(idRubro: number): boolean {
    return this.idsRubrosTemporales().includes(idRubro);
  }

  resumenRubrosSeleccionados(): string {
    const idsSeleccionados = this.formularioTienda.controls.idsRubros.value;
    const nombres = this.store.rubros()
      .filter((rubro) => idsSeleccionados.includes(rubro.idRubro))
      .map((rubro) => rubro.nombre);

    return nombres.length > 0 ? nombres.join(', ') : 'Aún no seleccionaste rubros.';
  }

  @HostListener('document:keydown.escape')
  cerrarSelectorConEscape(): void {
    if (this.mostrandoSelectorRubros()) this.cerrarSelectorRubros();
  }

  describirRubros(tienda: TiendaVendedor): string {
    return tienda.rubros.length > 0
      ? tienda.rubros.map((rubro) => rubro.nombre).join(', ')
      : 'Rubro pendiente';
  }

  eliminarTienda(tienda: TiendaVendedor): void {
    if (!confirmarAccionCritica(`Vas a eliminar la tienda "${tienda.nombre}".`)) return;

    if (this.idTiendaEditando() === tienda.idTienda) this.cancelarEdicion();
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

  campoTieneError(campo: keyof typeof this.formularioTienda.controls): boolean {
    const control = this.formularioTienda.controls[campo];
    return control.invalid && (control.touched || control.dirty);
  }
}
