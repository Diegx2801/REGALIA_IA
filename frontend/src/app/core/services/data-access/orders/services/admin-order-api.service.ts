import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_ENDPOINTS } from '../../../../config/api.config';
import { ApiResponse } from '../../../../../shared/models/api-response.model';
import { AdminOrderQueryApi, OrderApiDto } from '../models/order-api.model';

@Injectable({ providedIn: 'root' })
export class AdminOrderApiService {
  private readonly http = inject(HttpClient);

  getOrders(query: AdminOrderQueryApi = {}): Observable<OrderApiDto[]> {
    const params = this.buildParams(query);

    return this.http
      .get<ApiResponse<OrderApiDto[]>>(API_ENDPOINTS.admin.orders, { params })
      .pipe(map((response) => response.data ?? []));
  }

  getOrderById(orderId: number): Observable<OrderApiDto> {
    return this.http
      .get<ApiResponse<OrderApiDto>>(API_ENDPOINTS.admin.orderById(orderId))
      .pipe(map((response) => response.data));
  }

  private buildParams(query: AdminOrderQueryApi): HttpParams {
    let params = new HttpParams();

    if (query.estadoPago && query.estadoPago !== 'TODOS') {
      params = params.set('estadoPago', query.estadoPago);
    }

    if (query.search?.trim()) {
      params = params
        .set('searchField', query.searchField ?? 'ID_PEDIDO')
        .set('search', query.search.trim());
    }

    return params;
  }
}
