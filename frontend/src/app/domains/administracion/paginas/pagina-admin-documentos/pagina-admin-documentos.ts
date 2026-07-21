import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { obtenerMensajeErrorUsuario } from '../../../../core/http/modelos/error-api.model';
import { BotonDirective } from '../../../../shared/directivas/boton.directive';
import { EstadoPantallaComponent } from '../../../../shared/ui/estado-pantalla/estado-pantalla';
import { confirmarAccionCritica } from '../../../../shared/utilidades/confirmar-accion.util';
import { DocumentosAdministracionApi } from '../../acceso-datos/documentos-administracion-api';
import {
  DocumentoAdministracion,
  EstadoDocumentoAdministracion,
} from '../../modelos/documento-administracion.model';

type FiltroEstadoDocumento = EstadoDocumentoAdministracion | 'TODOS';
type AccionDocumento = 'verificar' | 'observar' | 'rechazar';

@Component({
  selector: 'app-pagina-admin-documentos',
  imports: [BotonDirective, DatePipe, EstadoPantallaComponent, FormsModule],
  templateUrl: './pagina-admin-documentos.html',
  styleUrl: './pagina-admin-documentos.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaAdminDocumentos implements OnInit {
  private readonly api = inject(DocumentosAdministracionApi);
  private readonly destroyRef = inject(DestroyRef);

  readonly documentos = signal<DocumentoAdministracion[]>([]);
  readonly documentoSeleccionado = signal<DocumentoAdministracion | null>(null);
  readonly busqueda = signal('');
  readonly estado = signal<FiltroEstadoDocumento>('PENDIENTE');
  readonly cargando = signal(true);
  readonly cargandoDetalle = signal(false);
  readonly procesando = signal<number | null>(null);
  readonly mensajeError = signal<string | null>(null);
  readonly mensajeExito = signal<string | null>(null);

  readonly documentosFiltrados = computed(() => {
    const termino = this.busqueda().trim().toLocaleLowerCase('es-PE');
    const estado = this.estado();
    return this.documentos().filter((documento) => {
      const coincideEstado = estado === 'TODOS' || documento.estadoVerificacion === estado;
      if (!coincideEstado) return false;
      if (!termino) return true;
      return [
        documento.nombreCompleto,
        documento.correo,
        documento.numeroDocumento,
        documento.abreviatura,
      ]
        .join(' ')
        .toLocaleLowerCase('es-PE')
        .includes(termino);
    });
  });

  readonly pendientes = computed(
    () =>
      this.documentos().filter((documento) => documento.estadoVerificacion === 'PENDIENTE').length,
  );

  ngOnInit(): void {
    this.cargarDocumentos();
  }

  actualizarBusqueda(valor: string): void {
    this.busqueda.set(valor);
  }

  actualizarEstado(valor: string): void {
    this.estado.set(valor as FiltroEstadoDocumento);
    this.documentoSeleccionado.set(null);
    this.cargarDocumentos();
  }

  cargarDocumentos(): void {
    this.cargando.set(true);
    this.mensajeError.set(null);
    const filtroActual = this.estado();
    const estado: EstadoDocumentoAdministracion | undefined =
      filtroActual === 'TODOS' ? undefined : filtroActual;
    this.api
      .listar(estado)
      .pipe(
        finalize(() => this.cargando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (documentos) => this.documentos.set(documentos),
        error: (error: unknown) =>
          this.mensajeError.set(
            obtenerMensajeErrorUsuario(error, 'No pudimos cargar los documentos.'),
          ),
      });
  }

  seleccionarDocumento(idDocumento: number): void {
    this.cargandoDetalle.set(true);
    this.mensajeError.set(null);
    this.api
      .obtenerPorId(idDocumento)
      .pipe(
        finalize(() => this.cargandoDetalle.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (documento) => this.documentoSeleccionado.set(documento),
        error: (error: unknown) =>
          this.mensajeError.set(
            obtenerMensajeErrorUsuario(error, 'No pudimos abrir el documento.'),
          ),
      });
  }

  cerrarDetalle(): void {
    this.documentoSeleccionado.set(null);
  }

  cambiarEstado(documento: DocumentoAdministracion, accion: AccionDocumento): void {
    const etiquetas: Record<AccionDocumento, string> = {
      verificar: 'verificar',
      observar: 'marcar como observado',
      rechazar: 'rechazar',
    };
    if (
      !confirmarAccionCritica(
        `Vas a ${etiquetas[accion]} el documento ${documento.abreviatura} de ${documento.nombreCompleto}.`,
      )
    )
      return;

    this.procesando.set(documento.idDocumento);
    this.mensajeError.set(null);
    this.mensajeExito.set(null);
    this.api
      .cambiarEstado(documento.idDocumento, accion)
      .pipe(
        finalize(() => this.procesando.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (actualizado) => {
          this.documentos.update((documentos) =>
            documentos.map((actual) =>
              actual.idDocumento === actualizado.idDocumento ? actualizado : actual,
            ),
          );
          this.documentoSeleccionado.set(actualizado);
          this.mensajeExito.set('Estado documental actualizado correctamente.');
        },
        error: (error: unknown) =>
          this.mensajeError.set(
            obtenerMensajeErrorUsuario(error, 'No pudimos actualizar el documento.'),
          ),
      });
  }

  etiquetaEstado(estado: EstadoDocumentoAdministracion): string {
    return {
      PENDIENTE: 'Pendiente',
      VERIFICADO: 'Verificado',
      OBSERVADO: 'Observado',
      RECHAZADO: 'Rechazado',
      DESCONOCIDO: 'Sin estado',
    }[estado];
  }
}
