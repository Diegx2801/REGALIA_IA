import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_ENDPOINTS } from '../../../../config/api.config';
import { ApiResponse, PageApiDto } from '../../../../../shared/models/api-response.model';
import { AdminSellerApiDto, AdminSellerQueryApi } from '../models/admin-seller-api.model';

@Injectable({ providedIn: 'root' })
export class RegaliaAdminSellerApiService {
  private readonly http = inject(HttpClient);

  getSellers(query: AdminSellerQueryApi = {}): Observable<PageApiDto<AdminSellerApiDto>> {
    const params = this.buildParams(query);

    return this.http
      .get<ApiResponse<PageApiDto<AdminSellerApiDto>>>(API_ENDPOINTS.admin.sellers, { params })
      .pipe(map((response) => response.data ?? this.emptyPage(query)));
  }

  getSellerById(sellerId: number): Observable<AdminSellerApiDto> {
    return this.http
      .get<ApiResponse<AdminSellerApiDto>>(API_ENDPOINTS.admin.sellerById(sellerId))
      .pipe(map((response) => response.data));
  }

  private buildParams(query: AdminSellerQueryApi): HttpParams {
    let params = new HttpParams()
      .set('page', String(query.page ?? 0))
      .set('size', String(query.size ?? 10))
      .set('sort', query.sort ?? 'idVendedor,asc');

    if (query.estado && query.estado !== 'TODOS') {
      params = params.set('estado', query.estado);
    }

    if (query.verificacion && query.verificacion !== 'TODOS') {
      params = params.set('verificacion', query.verificacion);
    }

    if (query.search?.trim()) {
      params = params
        .set('searchField', query.searchField ?? 'NOMBRE')
        .set('search', query.search.trim());
    }

    return params;
  }

  private emptyPage(query: AdminSellerQueryApi): PageApiDto<AdminSellerApiDto> {
    return {
      contenido: [],
      paginaActual: query.page ?? 0,
      tamanioPagina: query.size ?? 10,
      totalElementos: 0,
      totalPaginas: 0,
      ultimaPagina: true,
    };
  }
}
