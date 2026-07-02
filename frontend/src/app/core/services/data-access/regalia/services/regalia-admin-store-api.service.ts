import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_ENDPOINTS } from '../../../../config/api.config';
import { ApiResponse } from '../../../../../shared/models/api-response.model';
import { AdminStoreApiDto, AdminStoreReviewStatus } from '../models/admin-store-api.model';

@Injectable({ providedIn: 'root' })
export class RegaliaAdminStoreApiService {
  private readonly http = inject(HttpClient);

  getStores(status?: AdminStoreReviewStatus): Observable<AdminStoreApiDto[]> {
    const params = status ? new HttpParams().set('estadoRevision', status) : undefined;

    return this.http
      .get<ApiResponse<AdminStoreApiDto[]>>(API_ENDPOINTS.admin.stores, { params })
      .pipe(map((response) => response.data ?? []));
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
}
