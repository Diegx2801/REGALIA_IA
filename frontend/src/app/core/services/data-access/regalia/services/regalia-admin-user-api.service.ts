import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_ENDPOINTS } from '../../../../config/api.config';
import { ApiResponse } from '../../../../../shared/models/api-response.model';
import { AdminUserApiDto, AdminUserStatusFilterApi } from '../models/admin-user-api.model';

@Injectable({ providedIn: 'root' })
export class RegaliaAdminUserApiService {
  private readonly http = inject(HttpClient);

  getUsers(status: AdminUserStatusFilterApi = 'TODOS'): Observable<AdminUserApiDto[]> {
    const params = new HttpParams().set('estado', status);

    return this.http
      .get<ApiResponse<AdminUserApiDto[]>>(API_ENDPOINTS.admin.users, { params })
      .pipe(map((response) => response.data ?? []));
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
}
