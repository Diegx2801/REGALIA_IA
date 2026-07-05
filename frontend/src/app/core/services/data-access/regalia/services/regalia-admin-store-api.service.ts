import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_ENDPOINTS } from '../../../../config/api.config';
import { ApiResponse, PageApiDto } from '../../../../../shared/models/api-response.model';
import { AdminStoreApiDto, AdminStoreQueryApi } from '../models/admin-store-api.model';

@Injectable({ providedIn: 'root' })
export class RegaliaAdminStoreApiService {
  private readonly http = inject(HttpClient);

  getStores(query: AdminStoreQueryApi = {}): Observable<PageApiDto<AdminStoreApiDto>> {
    const params = this.buildParams(query);

    return this.http
      .get<ApiResponse<PageApiDto<AdminStoreApiDto>>>(API_ENDPOINTS.admin.stores, { params })
      .pipe(map((response) => response.data ?? this.emptyPage(query)));
  }

  getStoreById(storeId: number): Observable<AdminStoreApiDto> {
    return this.http
      .get<ApiResponse<AdminStoreApiDto>>(API_ENDPOINTS.admin.storeById(storeId))
      .pipe(map((response) => response.data));
  }

  markPending(storeId: number): Observable<AdminStoreApiDto> {
    return this.patchStoreStatus(API_ENDPOINTS.admin.markStorePending(storeId));
  }

  approve(storeId: number): Observable<AdminStoreApiDto> {
    return this.patchStoreStatus(API_ENDPOINTS.admin.approveStore(storeId));
  }

  observe(storeId: number): Observable<AdminStoreApiDto> {
    return this.patchStoreStatus(API_ENDPOINTS.admin.observeStore(storeId));
  }

  reject(storeId: number): Observable<AdminStoreApiDto> {
    return this.patchStoreStatus(API_ENDPOINTS.admin.rejectStore(storeId));
  }

  private patchStoreStatus(url: string): Observable<AdminStoreApiDto> {
    return this.http
      .patch<ApiResponse<AdminStoreApiDto>>(url, {})
      .pipe(map((response) => response.data));
  }

  private buildParams(query: AdminStoreQueryApi): HttpParams {
    let params = new HttpParams()
      .set('page', String(query.page ?? 0))
      .set('size', String(query.size ?? 10))
      .set('sort', query.sort ?? 'idTienda,asc');

    if (query.estadoRevision) {
      params = params.set('estadoRevision', query.estadoRevision);
    }

    if (query.search?.trim()) {
      params = params
        .set('searchField', query.searchField ?? 'NOMBRE')
        .set('search', query.search.trim());
    }

    return params;
  }

  private emptyPage(query: AdminStoreQueryApi): PageApiDto<AdminStoreApiDto> {
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
