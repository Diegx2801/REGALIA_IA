import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { obtenerMensajeErrorUsuario } from '../../../../core/http/modelos/error-api.model';
import { BotonDirective } from '../../../../shared/directivas/boton.directive';
import { RespuestaPaginada } from '../../../../shared/modelos/respuesta-api.model';
import { EstadoPantallaComponent } from '../../../../shared/ui/estado-pantalla/estado-pantalla';
import { PaginacionPanelComponent } from '../../../../shared/ui/paginacion-panel/paginacion-panel';
import { confirmarAccionCritica } from '../../../../shared/utilidades/confirmar-accion.util';
import {
  ConsultaDocumentosAdministracion,
  DocumentosAdministracionApi,
} from '../../acceso-datos/documentos-administracion-api';
import {
  DocumentoAdministracion,
  EstadoDocumentoAdministracion,
} from '../../modelos/documento-administracion.model';
import {
  enteroDesdeUrl,
  parametrosDeConsulta,
  textoDesdeUrl,
  valorPermitidoDesdeUrl,
} from '../../utilidades/consulta-admin-url.util';

type FiltroEstadoDocumento = EstadoDocumentoAdministracion | 'TODOS';
type AccionDocumento = 'verificar' | 'observar' | 'rechazar';

@Component({
  selector: 'app-pagina-admin-documentos',
  imports: [BotonDirective, DatePipe, EstadoPantallaComponent, PaginacionPanelComponent, ReactiveFormsModule],
  templateUrl: './pagina-admin-documentos.html',
  styleUrl: './pagina-admin-documentos.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaAdminDocumentos implements OnInit {
  private static readonly TAMANIO_PAGINA = 20;
  private readonly api = inject(DocumentosAdministracionApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly documentos = signal<DocumentoAdministracion[]>([]);
  readonly documentoSeleccionado = signal<DocumentoAdministracion | null>(null);
  readonly totalDocumentos = signal(0);
  readonly paginaActual = signal(0);
  readonly totalPaginas = signal(0);
  readonly cargando = signal(true);
  readonly cargandoDetalle = signal(false);
  readonly procesando = signal<number | null>(null);
  readonly mensajeError = signal<string | null>(null);
  readonly mensajeExito = signal<string | null>(null);

  readonly formularioFiltros = new FormGroup({
    estado: new FormControl<FiltroEstadoDocumento>('PENDIENTE', { nonNullable: true }),
    campoBusqueda: new FormControl<'TODOS' | 'NOMBRE' | 'CORREO' | 'DOCUMENTO'>('TODOS', {
      nonNullable: true,
    }),
    busqueda: new FormControl('', { nonNullable: true }),
    orden: new FormControl<'fechaCreacion,asc' | 'fechaCreacion,desc' | 'numeroDocumento,asc' | 'numeroDocumento,desc'>(
      'fechaCreacion,desc',
      { nonNullable: true },
    ),
  });

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((parametros) => {
      this.aplicarParametrosUrl(parametros);
      this.cargarDocumentos();
    });
  }

  aplicarFiltros(): void {
    this.documentoSeleccionado.set(null);
    this.actualizarUrlConsulta(0);
  }

  limpiarFiltros(): void {
    this.formularioFiltros.reset({
      estado: 'PENDIENTE',
      campoBusqueda: 'TODOS',
      busqueda: '',
      orden: 'fechaCreacion,desc',
    });
    this.documentoSeleccionado.set(null);
    this.actualizarUrlConsulta(0);
  }

  paginaAnterior(): void {
    if (this.paginaActual() === 0 || this.cargando()) return;
    this.actualizarUrlConsulta(this.paginaActual() - 1);
  }

  paginaSiguiente(): void {
    if (this.paginaActual() + 1 >= this.totalPaginas() || this.cargando()) return;
    this.actualizarUrlConsulta(this.paginaActual() + 1);
  }

  cargarDocumentos(): void {
    this.cargando.set(true);
    this.mensajeError.set(null);
    this.api
      .listar(this.crearConsulta())
      .pipe(
        finalize(() => this.cargando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (pagina) => this.actualizarPagina(pagina),
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
          this.documentoSeleccionado.set(actualizado);
          this.mensajeExito.set('Estado documental actualizado correctamente.');
          this.cargarDocumentos();
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

  private actualizarPagina(pagina: RespuestaPaginada<DocumentoAdministracion>): void {
    this.documentos.set(pagina.contenido);
    this.totalDocumentos.set(pagina.totalElementos);
    this.paginaActual.set(pagina.paginaActual);
    this.totalPaginas.set(pagina.totalPaginas);
  }

  private crearConsulta(): ConsultaDocumentosAdministracion {
    const filtros = this.formularioFiltros.getRawValue();
    return {
      estado: filtros.estado === 'TODOS' ? undefined : filtros.estado,
      campoBusqueda: filtros.campoBusqueda,
      busqueda: filtros.busqueda,
      page: this.paginaActual(),
      size: PaginaAdminDocumentos.TAMANIO_PAGINA,
      sort: filtros.orden,
    };
  }

  private aplicarParametrosUrl(parametros: import('@angular/router').ParamMap): void {
    const estado = valorPermitidoDesdeUrl(parametros, 'estado', 'PENDIENTE', [
      'TODOS', 'PENDIENTE', 'VERIFICADO', 'OBSERVADO', 'RECHAZADO',
    ] as const);
    const campoBusqueda = valorPermitidoDesdeUrl(parametros, 'campo', 'TODOS', [
      'TODOS', 'NOMBRE', 'CORREO', 'DOCUMENTO',
    ] as const);
    const orden = valorPermitidoDesdeUrl(parametros, 'orden', 'fechaCreacion,desc', [
      'fechaCreacion,asc', 'fechaCreacion,desc', 'numeroDocumento,asc', 'numeroDocumento,desc',
    ] as const);

    this.paginaActual.set(enteroDesdeUrl(parametros, 'pagina', 0));
    this.formularioFiltros.patchValue({
      estado,
      campoBusqueda,
      busqueda: textoDesdeUrl(parametros, 'buscar', ''),
      orden,
    }, { emitEvent: false });
  }

  private actualizarUrlConsulta(pagina: number): void {
    const filtros = this.formularioFiltros.getRawValue();
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: parametrosDeConsulta(
        {
          estado: filtros.estado,
          campo: filtros.campoBusqueda,
          buscar: filtros.busqueda.trim(),
          orden: filtros.orden,
          pagina,
        },
        { estado: 'PENDIENTE', campo: 'TODOS', buscar: '', orden: 'fechaCreacion,desc', pagina: 0 },
      ),
      replaceUrl: true,
    });
  }
}
