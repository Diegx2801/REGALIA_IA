import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_ENDPOINTS } from '../../../../config/api.config';
import { ApiResponse } from '../../../../../shared/models/api-response.model';
import {
  ConfirmOrderApiRequest,
  DeliveryTypeApiDto,
  InitialPaymentOptionApiDto,
  OrderApiDto,
} from '../models/order-api.model';

@Injectable({ providedIn: 'root' })
export class OrderCheckoutApiService {
  private readonly http = inject(HttpClient);

  getDeliveryTypes(): Observable<DeliveryTypeApiDto[]> {
    return this.http
      .get<ApiResponse<DeliveryTypeApiDto[]>>(API_ENDPOINTS.deliveryTypes.list)
      .pipe(map((response) => response.data ?? []));
  }

  getInitialPaymentOptions(): Observable<InitialPaymentOptionApiDto[]> {
    return this.http
      .get<ApiResponse<InitialPaymentOptionApiDto[]>>(API_ENDPOINTS.orders.initialPaymentOptions)
      .pipe(map((response) => response.data ?? []));
  }

  confirmOrder(request: ConfirmOrderApiRequest): Observable<OrderApiDto> {
    return this.http
      .post<ApiResponse<OrderApiDto>>(API_ENDPOINTS.orders.confirm, request)
      .pipe(map((response) => response.data));
  }
}
