import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_ENDPOINTS } from '../../../../config/api.config';
import { ApiResponse } from '../../../../../shared/models/api-response.model';
import { AdminSellerApiDto } from '../models/admin-seller-api.model';

@Injectable({ providedIn: 'root' })
export class RegaliaAdminSellerApiService {
  private readonly http = inject(HttpClient);

  getSellers(): Observable<AdminSellerApiDto[]> {
    return this.http
      .get<ApiResponse<AdminSellerApiDto[]>>(API_ENDPOINTS.admin.sellers)
      .pipe(map((response) => response.data ?? []));
  }

  getSellerById(sellerId: number): Observable<AdminSellerApiDto> {
    return this.http
      .get<ApiResponse<AdminSellerApiDto>>(API_ENDPOINTS.admin.sellerById(sellerId))
      .pipe(map((response) => response.data));
  }
}
