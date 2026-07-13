import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable, timeout } from 'rxjs';
import { ENDPOINTS_API } from '../../../core/configuracion/endpoints-api';
import { RespuestaApi } from '../../../shared/modelos/respuesta-api.model';
import { DatoMaestroAdmin } from '../modelos/dato-maestro-admin.model';

interface RubroAdminDto {
  idRubro: number;
  nombre: string | null;
  descripcion: string | null;
  estado: boolean | null;
}

interface TipoProductoAdminDto {
  idTipoProducto: number;
  nombre: string | null;
  estado: boolean | null;
}

interface TipoEntregaAdminDto {
  idTipoEntrega: number;
  nombre: string | null;
  estado: boolean | null;
}

interface TipoPagoAdminDto {
  idTipoPago: number;
  codigo: string | null;
  nombre: string | null;
  descripcion: string | null;
  estado: boolean | null;
}

interface TipoDocumentoAdminDto {
  idTipoDocumento: number;
  categoriaDocumento: string | null;
  nombre: string | null;
  abreviatura: string | null;
  longitudMinima: number | null;
  longitudMaxima: number | null;
  estado: boolean | null;
}

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

  private mapearRubro(dto: RubroAdminDto): DatoMaestroAdmin {
    return {
      id: dto.idRubro,
      categoria: 'Rubro',
      nombre: dto.nombre?.trim() || 'Rubro sin nombre',
      descripcion: dto.descripcion?.trim() || 'Sin descripcion',
      estado: Boolean(dto.estado),
    };
  }

  private mapearTipoProducto(dto: TipoProductoAdminDto): DatoMaestroAdmin {
    return {
      id: dto.idTipoProducto,
      categoria: 'Tipo de producto',
      nombre: dto.nombre?.trim() || 'Tipo sin nombre',
      descripcion: 'Clasificacion visible para productos del catalogo.',
      estado: Boolean(dto.estado),
    };
  }

  private mapearTipoEntrega(dto: TipoEntregaAdminDto): DatoMaestroAdmin {
    return {
      id: dto.idTipoEntrega,
      categoria: 'Tipo de entrega',
      nombre: dto.nombre?.trim() || 'Entrega sin nombre',
      descripcion: 'Modalidad disponible para solicitudes de pedido.',
      estado: Boolean(dto.estado),
    };
  }

  private mapearTipoPago(dto: TipoPagoAdminDto): DatoMaestroAdmin {
    return {
      id: dto.idTipoPago,
      categoria: 'Tipo de pago',
      nombre: `${dto.codigo?.trim() || 'SIN_CODIGO'} - ${dto.nombre?.trim() || 'Pago sin nombre'}`,
      descripcion: dto.descripcion?.trim() || 'Sin descripcion',
      estado: Boolean(dto.estado),
    };
  }

  private mapearTipoDocumento(dto: TipoDocumentoAdminDto): DatoMaestroAdmin {
    const rango = [dto.longitudMinima, dto.longitudMaxima].every((valor) => valor !== null)
      ? `Longitud ${dto.longitudMinima}-${dto.longitudMaxima}`
      : 'Longitud no configurada';

    return {
      id: dto.idTipoDocumento,
      categoria: 'Tipo de documento',
      nombre: `${dto.abreviatura?.trim() || 'DOC'} - ${dto.nombre?.trim() || 'Documento sin nombre'}`,
      descripcion: `${dto.categoriaDocumento?.trim() || 'Sin categoria'} · ${rango}`,
      estado: Boolean(dto.estado),
    };
  }
}
