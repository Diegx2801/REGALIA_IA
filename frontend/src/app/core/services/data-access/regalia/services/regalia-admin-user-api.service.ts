import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_ENDPOINTS } from '../../../../config/api.config';
import { ApiResponse, PageApiDto } from '../../../../../shared/models/api-response.model';
import { AdminUserApiDto, AdminUserQueryApi } from '../models/admin-user-api.model';

@Injectable({ providedIn: 'root' })
export class RegaliaAdminUserApiService {
  private readonly http = inject(HttpClient);

  getUsers(query: AdminUserQueryApi = {}): Observable<PageApiDto<AdminUserApiDto>> {
    const params = this.buildParams(query);

    return this.http
      .get<ApiResponse<PageApiDto<AdminUserApiDto>>>(API_ENDPOINTS.admin.users, { params })
      .pipe(map((response) => response.data ?? this.emptyPage(query)));
  }

  getUserById(userId: number): Observable<AdminUserApiDto> {
    return this.http
      .get<ApiResponse<AdminUserApiDto>>(API_ENDPOINTS.admin.userById(userId))
      .pipe(map((response) => response.data));
  }

  deactivateUser(userId: number): Observable<AdminUserApiDto> {
    return this.http
      .patch<ApiResponse<AdminUserApiDto>>(API_ENDPOINTS.admin.deactivateUser(userId), {})
      .pipe(map((response) => response.data));
  }

  reactivateUser(userId: number): Observable<AdminUserApiDto> {
    return this.http
      .patch<ApiResponse<AdminUserApiDto>>(API_ENDPOINTS.admin.reactivateUser(userId), {})
      .pipe(map((response) => response.data));
  }

  private buildParams(query: AdminUserQueryApi): HttpParams {
    let params = new HttpParams()
      .set('estado', query.estado ?? 'TODOS')
      .set('page', String(query.page ?? 0))
      .set('size', String(query.size ?? 10))
      .set('sort', query.sort ?? 'idUsuario,asc');

    if (query.search?.trim()) {
      params = params
        .set('searchField', query.searchField ?? 'NOMBRE')
        .set('search', query.search.trim());
    }

    return params;
  }

  private emptyPage(query: AdminUserQueryApi): PageApiDto<AdminUserApiDto> {
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
