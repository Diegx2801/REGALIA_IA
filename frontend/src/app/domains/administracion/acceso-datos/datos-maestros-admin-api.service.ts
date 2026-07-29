import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable, timeout } from 'rxjs';
import { ENDPOINTS_API } from '../../../core/configuracion/endpoints-api';
import { RespuestaApi } from '../../../shared/modelos/respuesta-api.model';
import { DatoMaestroAdmin, TipoDatoMaestroAdmin } from '../modelos/dato-maestro-admin.model';

interface DatoMaestroDtoBase {
  estado: boolean | null;
  fechaCreacion: string | null;
  fechaActualizacion: string | null;
}

interface RubroAdminDto extends DatoMaestroDtoBase { idRubro: number; nombre: string | null; descripcion: string | null; }
interface TipoProductoAdminDto extends DatoMaestroDtoBase { idTipoProducto: number; nombre: string | null; }
interface TipoEntregaAdminDto extends DatoMaestroDtoBase { idTipoEntrega: number; nombre: string | null; }
interface TipoPagoAdminDto extends DatoMaestroDtoBase { idTipoPago: number; codigo: string | null; nombre: string | null; descripcion: string | null; }
interface TipoDocumentoAdminDto extends DatoMaestroDtoBase {
  idTipoDocumento: number; idCategoriaDocumento: number | null; categoriaDocumento: string | null;
  nombre: string | null; abreviatura: string | null; longitudMinima: number | null; longitudMaxima: number | null;
}

const TIEMPO_ESPERA_DATOS_MAESTROS_ADMIN_MS = 10000;

/** Consulta los catálogos controlados que la administración puede supervisar. */
@Injectable({ providedIn: 'root' })
export class DatosMaestrosAdminApiService {
  private readonly http = inject(HttpClient);

  obtenerDatosMaestros(): Observable<DatoMaestroAdmin[]> {
    return forkJoin({
      rubros: this.http.get<RespuestaApi<RubroAdminDto[]>>(ENDPOINTS_API.administracion.rubros),
      tiposProducto: this.http.get<RespuestaApi<TipoProductoAdminDto[]>>(ENDPOINTS_API.administracion.tiposProducto),
      tiposEntrega: this.http.get<RespuestaApi<TipoEntregaAdminDto[]>>(ENDPOINTS_API.administracion.tiposEntrega),
      tiposPago: this.http.get<RespuestaApi<TipoPagoAdminDto[]>>(ENDPOINTS_API.administracion.tiposPago),
      tiposDocumento: this.http.get<RespuestaApi<TipoDocumentoAdminDto[]>>(ENDPOINTS_API.administracion.tiposDocumento),
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

  private mapearRubro(dto: RubroAdminDto): DatoMaestroAdmin {
    return this.crearDatoBase({ id: dto.idRubro, tipo: 'RUBRO', categoria: 'Rubros', nombre: dto.nombre?.trim() || 'Rubro sin nombre', descripcion: dto.descripcion?.trim() || 'Sin descripcion', dto });
  }

  private mapearTipoProducto(dto: TipoProductoAdminDto): DatoMaestroAdmin {
    return this.crearDatoBase({ id: dto.idTipoProducto, tipo: 'TIPO_PRODUCTO', categoria: 'Tipos de producto', nombre: dto.nombre?.trim() || 'Tipo sin nombre', descripcion: 'Clasificacion visible para productos del catalogo.', dto });
  }

  private mapearTipoEntrega(dto: TipoEntregaAdminDto): DatoMaestroAdmin {
    return this.crearDatoBase({ id: dto.idTipoEntrega, tipo: 'TIPO_ENTREGA', categoria: 'Tipos de entrega', nombre: dto.nombre?.trim() || 'Entrega sin nombre', descripcion: 'Modalidad disponible para solicitudes de pedido.', dto });
  }

  private mapearTipoPago(dto: TipoPagoAdminDto): DatoMaestroAdmin {
    return this.crearDatoBase({ id: dto.idTipoPago, tipo: 'TIPO_PAGO', categoria: 'Tipos de pago', nombre: dto.nombre?.trim() || 'Pago sin nombre', descripcion: dto.descripcion?.trim() || 'Sin descripcion', codigo: dto.codigo?.trim() || 'SIN_CODIGO', dto });
  }

  private mapearTipoDocumento(dto: TipoDocumentoAdminDto): DatoMaestroAdmin {
    const rango = [dto.longitudMinima, dto.longitudMaxima].every((valor) => valor !== null)
      ? `Longitud ${dto.longitudMinima}-${dto.longitudMaxima}`
      : 'Longitud no configurada';
    return this.crearDatoBase({
      id: dto.idTipoDocumento, tipo: 'TIPO_DOCUMENTO', categoria: 'Tipos de documento', nombre: dto.nombre?.trim() || 'Documento sin nombre',
      descripcion: `${dto.categoriaDocumento?.trim() || 'Sin categoria'} - ${rango}`,
      abreviatura: dto.abreviatura?.trim() || 'DOC', idCategoriaDocumento: dto.idCategoriaDocumento,
      categoriaDocumento: dto.categoriaDocumento?.trim() || null, longitudMinima: dto.longitudMinima, longitudMaxima: dto.longitudMaxima, dto,
    });
  }

  private crearDatoBase(configuracion: { id: number; tipo: TipoDatoMaestroAdmin; categoria: string; nombre: string; descripcion: string; dto: DatoMaestroDtoBase; codigo?: string; abreviatura?: string; idCategoriaDocumento?: number | null; categoriaDocumento?: string | null; longitudMinima?: number | null; longitudMaxima?: number | null; }): DatoMaestroAdmin {
    return {
      id: configuracion.id, tipo: configuracion.tipo, categoria: configuracion.categoria, nombre: configuracion.nombre,
      descripcion: configuracion.descripcion, estado: Boolean(configuracion.dto.estado), codigo: configuracion.codigo ?? null,
      abreviatura: configuracion.abreviatura ?? null, idCategoriaDocumento: configuracion.idCategoriaDocumento ?? null,
      categoriaDocumento: configuracion.categoriaDocumento ?? null, longitudMinima: configuracion.longitudMinima ?? null,
      longitudMaxima: configuracion.longitudMaxima ?? null, fechaCreacion: configuracion.dto.fechaCreacion,
      fechaActualizacion: configuracion.dto.fechaActualizacion,
    };
  }
}
