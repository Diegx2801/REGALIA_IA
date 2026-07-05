import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_ENDPOINTS } from '../../../../config/api.config';
import { ApiResponse } from '../../../../../shared/models/api-response.model';
import {
  CreatePaymentCheckoutSessionApiRequest,
  PaymentCheckoutSessionApiDto,
} from '../models/payment-checkout-api.model';

@Injectable({ providedIn: 'root' })
export class PaymentCheckoutApiService {
  private readonly http = inject(HttpClient);

  createSession(
    request: CreatePaymentCheckoutSessionApiRequest,
  ): Observable<PaymentCheckoutSessionApiDto> {
    return this.http
      .post<ApiResponse<PaymentCheckoutSessionApiDto>>(API_ENDPOINTS.checkout.sessions, request)
      .pipe(map((response) => response.data));
  }
}
