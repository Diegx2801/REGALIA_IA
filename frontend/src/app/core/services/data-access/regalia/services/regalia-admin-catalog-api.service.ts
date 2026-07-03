import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { API_ENDPOINTS } from '../../../../config/api.config';
import { ApiResponse } from '../../../../../shared/models/api-response.model';
import {
  AdminCatalogGroup,
  AdminCatalogItem,
  AdminDeliveryTypeApiDto,
  AdminDocumentTypeApiDto,
  AdminPaymentTypeApiDto,
  AdminProductTypeApiDto,
  AdminRoleApiDto,
  AdminRubroApiDto,
} from '../models/admin-catalog-api.model';

@Injectable({ providedIn: 'root' })
export class RegaliaAdminCatalogApiService {
  private readonly http = inject(HttpClient);

  getCatalogs(): Observable<AdminCatalogGroup[]> {
    return forkJoin({
      rubros: this.getList<AdminRubroApiDto>(API_ENDPOINTS.admin.catalogs.rubros),
      productTypes: this.getList<AdminProductTypeApiDto>(
        API_ENDPOINTS.admin.catalogs.productTypes,
      ),
      deliveryTypes: this.getList<AdminDeliveryTypeApiDto>(
        API_ENDPOINTS.admin.catalogs.deliveryTypes,
      ),
      paymentTypes: this.getList<AdminPaymentTypeApiDto>(
        API_ENDPOINTS.admin.catalogs.paymentTypes,
      ),
      documentTypes: this.getList<AdminDocumentTypeApiDto>(
        API_ENDPOINTS.admin.catalogs.documentTypes,
      ),
      roles: this.getList<AdminRoleApiDto>(API_ENDPOINTS.admin.catalogs.roles),
    }).pipe(
      map(({ rubros, productTypes, deliveryTypes, paymentTypes, documentTypes, roles }) => [
        {
          type: 'RUBROS' as const,
          label: 'Rubros',
          description: 'Categorias comerciales usadas por tiendas y busqueda publica.',
          items: rubros.map((item) => this.mapRubro(item)),
        },
        {
          type: 'TIPOS_PRODUCTO' as const,
          label: 'Tipos de producto',
          description: 'Clasificacion base para catalogar productos del marketplace.',
          items: productTypes.map((item) => this.mapProductType(item)),
        },
        {
          type: 'TIPOS_ENTREGA' as const,
          label: 'Tipos de entrega',
          description: 'Opciones operativas disponibles para preparar y entregar pedidos.',
          items: deliveryTypes.map((item) => this.mapDeliveryType(item)),
        },
        {
          type: 'TIPOS_PAGO' as const,
          label: 'Tipos de pago',
          description: 'Codigos internos que gobiernan pagos iniciales, restantes y completos.',
          items: paymentTypes.map((item) => this.mapPaymentType(item)),
        },
        {
          type: 'TIPOS_DOCUMENTO' as const,
          label: 'Tipos de documento',
          description: 'Documentos aceptados para identidad, fiscalizacion y verificaciones.',
          items: documentTypes.map((item) => this.mapDocumentType(item)),
        },
        {
          type: 'ROLES' as const,
          label: 'Roles',
          description: 'Roles activos del sistema. Solo lectura desde este panel.',
          items: roles.map((item) => this.mapRole(item)),
        },
      ]),
    );
  }

  private getList<T>(url: string): Observable<T[]> {
    return this.http.get<ApiResponse<T[]>>(url).pipe(map((response) => response.data ?? []));
  }

  private mapRubro(item: AdminRubroApiDto): AdminCatalogItem {
    return {
      id: item.idRubro,
      type: 'RUBROS',
      name: item.nombre ?? 'Rubro sin nombre',
      description: item.descripcion ?? 'Sin descripcion registrada.',
      primaryMeta: `ID rubro #${item.idRubro}`,
      secondaryMeta: 'Visible para tiendas y filtros publicos',
      estado: item.estado,
      fechaCreacion: item.fechaCreacion,
      fechaActualizacion: item.fechaActualizacion,
    };
  }

  private mapProductType(item: AdminProductTypeApiDto): AdminCatalogItem {
    return {
      id: item.idTipoProducto,
      type: 'TIPOS_PRODUCTO',
      name: item.nombre ?? 'Tipo de producto sin nombre',
      description: 'Tipo usado para clasificar productos publicados por vendedores.',
      primaryMeta: `ID tipo producto #${item.idTipoProducto}`,
      secondaryMeta: 'Afecta organizacion interna de productos',
      estado: item.estado,
      fechaCreacion: item.fechaCreacion,
      fechaActualizacion: item.fechaActualizacion,
    };
  }

  private mapDeliveryType(item: AdminDeliveryTypeApiDto): AdminCatalogItem {
    return {
      id: item.idTipoEntrega,
      type: 'TIPOS_ENTREGA',
      name: item.nombre ?? 'Tipo de entrega sin nombre',
      description: 'Modalidad disponible para coordinar reserva, despacho o recojo.',
      primaryMeta: `ID tipo entrega #${item.idTipoEntrega}`,
      secondaryMeta: 'Afecta checkout y pedidos',
      estado: item.estado,
      fechaCreacion: item.fechaCreacion,
      fechaActualizacion: item.fechaActualizacion,
    };
  }

  private mapPaymentType(item: AdminPaymentTypeApiDto): AdminCatalogItem {
    return {
      id: item.idTipoPago,
      type: 'TIPOS_PAGO',
      name: item.nombre ?? 'Tipo de pago sin nombre',
      description: item.descripcion ?? 'Sin descripcion registrada.',
      primaryMeta: item.codigo ? `Codigo ${item.codigo}` : `ID tipo pago #${item.idTipoPago}`,
      secondaryMeta: 'Dato sensible para reglas de cobro',
      estado: item.estado,
      fechaCreacion: item.fechaCreacion,
      fechaActualizacion: item.fechaActualizacion,
    };
  }

  private mapDocumentType(item: AdminDocumentTypeApiDto): AdminCatalogItem {
    const lengthRange =
      item.longitudMinima && item.longitudMaxima
        ? `${item.longitudMinima} a ${item.longitudMaxima} caracteres`
        : 'Longitud no configurada';

    return {
      id: item.idTipoDocumento,
      type: 'TIPOS_DOCUMENTO',
      name: item.nombre ?? 'Tipo de documento sin nombre',
      description: `Abreviatura ${item.abreviatura ?? 'no registrada'} - ${lengthRange}.`,
      primaryMeta: item.categoriaDocumento ?? 'Categoria no registrada',
      secondaryMeta: `ID categoria #${item.idCategoriaDocumento ?? 'N/D'}`,
      estado: item.estado,
      fechaCreacion: item.fechaCreacion,
      fechaActualizacion: item.fechaActualizacion,
    };
  }

  private mapRole(item: AdminRoleApiDto): AdminCatalogItem {
    return {
      id: item.idRol,
      type: 'ROLES',
      name: item.nombre ?? 'Rol sin nombre',
      description: 'Rol de seguridad usado por autenticacion y autorizacion.',
      primaryMeta: `ID rol #${item.idRol}`,
      secondaryMeta: 'Dato maestro de seguridad',
      estado: item.estado,
      fechaCreacion: item.fechaCreacion,
      fechaActualizacion: item.fechaActualizacion,
    };
  }
}
