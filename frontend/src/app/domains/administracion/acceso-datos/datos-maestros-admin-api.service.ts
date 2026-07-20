import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable, timeout } from 'rxjs';
import { ENDPOINTS_API } from '../../../core/configuracion/endpoints-api';
import { RespuestaApi } from '../../../shared/modelos/respuesta-api.model';
import {
  DatoMaestroAdmin,
  SolicitudGuardarDatoMaestro,
  TipoDatoMaestroAdmin,
  ValoresFormularioDatoMaestro,
} from '../modelos/dato-maestro-admin.model';

interface DatoMaestroDtoBase {
  estado: boolean | null;
  fechaCreacion: string | null;
  fechaActualizacion: string | null;
}

interface RubroAdminDto extends DatoMaestroDtoBase {
  idRubro: number;
  nombre: string | null;
  descripcion: string | null;
}

interface TipoProductoAdminDto extends DatoMaestroDtoBase {
  idTipoProducto: number;
  nombre: string | null;
}

interface TipoEntregaAdminDto extends DatoMaestroDtoBase {
  idTipoEntrega: number;
  nombre: string | null;
}

interface TipoPagoAdminDto extends DatoMaestroDtoBase {
  idTipoPago: number;
  codigo: string | null;
  nombre: string | null;
  descripcion: string | null;
}

interface TipoDocumentoAdminDto extends DatoMaestroDtoBase {
  idTipoDocumento: number;
  idCategoriaDocumento: number | null;
  categoriaDocumento: string | null;
  nombre: string | null;
  abreviatura: string | null;
  longitudMinima: number | null;
  longitudMaxima: number | null;
}

type DatoMaestroAdminDto =
  | RubroAdminDto
  | TipoProductoAdminDto
  | TipoEntregaAdminDto
  | TipoPagoAdminDto
  | TipoDocumentoAdminDto;

interface NombreRequest {
  nombre: string;
}

interface RubroRequest extends NombreRequest {
  descripcion: string | null;
}

interface TipoPagoRequest extends NombreRequest {
  descripcion: string | null;
}

interface TipoDocumentoRequest extends NombreRequest {
  abreviatura: string;
  longitudMinima: number;
  longitudMaxima: number;
  idCategoriaDocumento: number;
}

type DatoMaestroRequest = NombreRequest | RubroRequest | TipoPagoRequest | TipoDocumentoRequest;

const TIEMPO_ESPERA_DATOS_MAESTROS_ADMIN_MS = 10000;

@Injectable({ providedIn: 'root' })
export class DatosMaestrosAdminApiService {
  private readonly http = inject(HttpClient);

  obtenerDatosMaestros(): Observable<DatoMaestroAdmin[]> {
    return forkJoin({
      rubros: this.http.get<RespuestaApi<RubroAdminDto[]>>(ENDPOINTS_API.administracion.rubros),
      tiposProducto: this.http.get<RespuestaApi<TipoProductoAdminDto[]>>(
        ENDPOINTS_API.administracion.tiposProducto,
      ),
      tiposEntrega: this.http.get<RespuestaApi<TipoEntregaAdminDto[]>>(
        ENDPOINTS_API.administracion.tiposEntrega,
      ),
      tiposPago: this.http.get<RespuestaApi<TipoPagoAdminDto[]>>(
        ENDPOINTS_API.administracion.tiposPago,
      ),
      tiposDocumento: this.http.get<RespuestaApi<TipoDocumentoAdminDto[]>>(
        ENDPOINTS_API.administracion.tiposDocumento,
      ),
    }).pipe(
      timeout(TIEMPO_ESPERA_DATOS_MAESTROS_ADMIN_MS),
      map(({ rubros, tiposProducto, tiposEntrega, tiposPago, tiposDocumento }) => [
        ...(rubros.data ?? []).map((item) => this.mapearRubro(item)),
        ...(tiposProducto.data ?? []).map((item) => this.mapearTipoProducto(item)),
        ...(tiposEntrega.data ?? []).map((item) => this.mapearTipoEntrega(item)),
        ...(tiposPago.data ?? []).map((item) => this.mapearTipoPago(item)),
        ...(tiposDocumento.data ?? []).map((item) => this.mapearTipoDocumento(item)),
      ]),
    );
  }

  guardarDatoMaestro(solicitud: SolicitudGuardarDatoMaestro): Observable<DatoMaestroAdmin> {
    const esEdicion = solicitud.id !== null;

    if (!esEdicion && solicitud.tipo === 'TIPO_PAGO') {
      throw new Error('El backend no permite crear tipos de pago.');
    }

    const endpointBase = this.obtenerEndpointBase(solicitud.tipo);
    const cuerpo = this.crearCuerpoSolicitud(solicitud.tipo, solicitud.valores);
    const peticion = esEdicion
      ? this.http.put<RespuestaApi<DatoMaestroAdminDto>>(`${endpointBase}/${solicitud.id}`, cuerpo)
      : this.http.post<RespuestaApi<DatoMaestroAdminDto>>(endpointBase, cuerpo);

    return peticion.pipe(
      timeout(TIEMPO_ESPERA_DATOS_MAESTROS_ADMIN_MS),
      map((respuesta) => {
        if (!respuesta.data) {
          throw new Error(respuesta.message ?? 'No se pudo guardar el dato maestro.');
        }

        return this.mapearDato(solicitud.tipo, respuesta.data);
      }),
    );
  }

  cambiarEstadoDatoMaestro(dato: DatoMaestroAdmin): Observable<void> {
    if (dato.tipo === 'TIPO_PAGO') {
      throw new Error('El backend no permite cambiar el estado de los tipos de pago.');
    }

    const endpoint = `${this.obtenerEndpointBase(dato.tipo)}/${dato.id}`;
    const peticion: Observable<unknown> = dato.estado
      ? this.http.delete<RespuestaApi<null>>(endpoint)
      : this.http.patch<RespuestaApi<DatoMaestroAdminDto>>(`${endpoint}/reactivar`, {});

    return peticion.pipe(
      timeout(TIEMPO_ESPERA_DATOS_MAESTROS_ADMIN_MS),
      map(() => undefined),
    );
  }

  private crearCuerpoSolicitud(
    tipo: TipoDatoMaestroAdmin,
    valores: ValoresFormularioDatoMaestro,
  ): DatoMaestroRequest {
    const nombre = valores.nombre.trim();

    if (tipo === 'RUBRO') {
      return { nombre, descripcion: valores.descripcion.trim() || null } satisfies RubroRequest;
    }

    if (tipo === 'TIPO_PAGO') {
      return { nombre, descripcion: valores.descripcion.trim() || null } satisfies TipoPagoRequest;
    }

    if (tipo === 'TIPO_DOCUMENTO') {
      if (
        valores.longitudMinima === null ||
        valores.longitudMaxima === null ||
        valores.idCategoriaDocumento === null
      ) {
        throw new Error('Completa la configuración del tipo de documento.');
      }

      return {
        nombre,
        abreviatura: valores.abreviatura.trim(),
        longitudMinima: valores.longitudMinima,
        longitudMaxima: valores.longitudMaxima,
        idCategoriaDocumento: valores.idCategoriaDocumento,
      } satisfies TipoDocumentoRequest;
    }

    return { nombre } satisfies NombreRequest;
  }

  private obtenerEndpointBase(tipo: TipoDatoMaestroAdmin): string {
    const endpoints: Record<TipoDatoMaestroAdmin, string> = {
      RUBRO: ENDPOINTS_API.administracion.rubros,
      TIPO_PRODUCTO: ENDPOINTS_API.administracion.tiposProducto,
      TIPO_ENTREGA: ENDPOINTS_API.administracion.tiposEntrega,
      TIPO_PAGO: ENDPOINTS_API.administracion.tiposPago,
      TIPO_DOCUMENTO: ENDPOINTS_API.administracion.tiposDocumento,
    };

    return endpoints[tipo];
  }

  private mapearDato(tipo: TipoDatoMaestroAdmin, dto: DatoMaestroAdminDto): DatoMaestroAdmin {
    if (tipo === 'RUBRO') return this.mapearRubro(dto as RubroAdminDto);
    if (tipo === 'TIPO_PRODUCTO') return this.mapearTipoProducto(dto as TipoProductoAdminDto);
    if (tipo === 'TIPO_ENTREGA') return this.mapearTipoEntrega(dto as TipoEntregaAdminDto);
    if (tipo === 'TIPO_PAGO') return this.mapearTipoPago(dto as TipoPagoAdminDto);
    return this.mapearTipoDocumento(dto as TipoDocumentoAdminDto);
  }

  private mapearRubro(dto: RubroAdminDto): DatoMaestroAdmin {
    return this.crearDatoBase({
      id: dto.idRubro,
      tipo: 'RUBRO',
      categoria: 'Rubros',
      nombre: dto.nombre?.trim() || 'Rubro sin nombre',
      descripcion: dto.descripcion?.trim() || 'Sin descripción',
      dto,
    });
  }

  private mapearTipoProducto(dto: TipoProductoAdminDto): DatoMaestroAdmin {
    return this.crearDatoBase({
      id: dto.idTipoProducto,
      tipo: 'TIPO_PRODUCTO',
      categoria: 'Tipos de producto',
      nombre: dto.nombre?.trim() || 'Tipo sin nombre',
      descripcion: 'Clasificación visible para productos del catálogo.',
      dto,
    });
  }

  private mapearTipoEntrega(dto: TipoEntregaAdminDto): DatoMaestroAdmin {
    return this.crearDatoBase({
      id: dto.idTipoEntrega,
      tipo: 'TIPO_ENTREGA',
      categoria: 'Tipos de entrega',
      nombre: dto.nombre?.trim() || 'Entrega sin nombre',
      descripcion: 'Modalidad disponible para solicitudes de pedido.',
      dto,
    });
  }

  private mapearTipoPago(dto: TipoPagoAdminDto): DatoMaestroAdmin {
    return this.crearDatoBase({
      id: dto.idTipoPago,
      tipo: 'TIPO_PAGO',
      categoria: 'Tipos de pago',
      nombre: dto.nombre?.trim() || 'Pago sin nombre',
      descripcion: dto.descripcion?.trim() || 'Sin descripción',
      codigo: dto.codigo?.trim() || 'SIN_CODIGO',
      dto,
    });
  }

  private mapearTipoDocumento(dto: TipoDocumentoAdminDto): DatoMaestroAdmin {
    const rango = [dto.longitudMinima, dto.longitudMaxima].every((valor) => valor !== null)
      ? `Longitud ${dto.longitudMinima}-${dto.longitudMaxima}`
      : 'Longitud no configurada';

    return this.crearDatoBase({
      id: dto.idTipoDocumento,
      tipo: 'TIPO_DOCUMENTO',
      categoria: 'Tipos de documento',
      nombre: dto.nombre?.trim() || 'Documento sin nombre',
      descripcion: `${dto.categoriaDocumento?.trim() || 'Sin categoría'} · ${rango}`,
      abreviatura: dto.abreviatura?.trim() || 'DOC',
      idCategoriaDocumento: dto.idCategoriaDocumento,
      categoriaDocumento: dto.categoriaDocumento?.trim() || null,
      longitudMinima: dto.longitudMinima,
      longitudMaxima: dto.longitudMaxima,
      dto,
    });
  }

  private crearDatoBase(configuracion: {
    id: number;
    tipo: TipoDatoMaestroAdmin;
    categoria: string;
    nombre: string;
    descripcion: string;
    dto: DatoMaestroDtoBase;
    codigo?: string;
    abreviatura?: string;
    idCategoriaDocumento?: number | null;
    categoriaDocumento?: string | null;
    longitudMinima?: number | null;
    longitudMaxima?: number | null;
  }): DatoMaestroAdmin {
    return {
      id: configuracion.id,
      tipo: configuracion.tipo,
      categoria: configuracion.categoria,
      nombre: configuracion.nombre,
      descripcion: configuracion.descripcion,
      estado: Boolean(configuracion.dto.estado),
      codigo: configuracion.codigo ?? null,
      abreviatura: configuracion.abreviatura ?? null,
      idCategoriaDocumento: configuracion.idCategoriaDocumento ?? null,
      categoriaDocumento: configuracion.categoriaDocumento ?? null,
      longitudMinima: configuracion.longitudMinima ?? null,
      longitudMaxima: configuracion.longitudMaxima ?? null,
      fechaCreacion: configuracion.dto.fechaCreacion,
      fechaActualizacion: configuracion.dto.fechaActualizacion,
    };
  }
}
