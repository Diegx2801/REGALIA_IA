import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_ENDPOINTS } from '../../../../config/api.config';
import { ApiResponse } from '../../../../../shared/models/api-response.model';
import { OrderApiDto } from '../models/order-api.model';

@Injectable({ providedIn: 'root' })
export class AdminOrderApiService {
  private readonly http = inject(HttpClient);

  getOrders(): Observable<OrderApiDto[]> {
    return this.http
      .get<ApiResponse<OrderApiDto[]>>(API_ENDPOINTS.admin.orders)
      .pipe(map((response) => response.data ?? []));
  }

  getOrderById(orderId: number): Observable<OrderApiDto> {
    return this.http
      .get<ApiResponse<OrderApiDto>>(API_ENDPOINTS.admin.orderById(orderId))
      .pipe(map((response) => response.data));
  }
}
