import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_ENDPOINTS } from '../../../../config/api.config';
import { ApiResponse } from '../../../../../shared/models/api-response.model';
import {
  SellerOrderDetailApiDto,
  SellerOrderSummaryApiDto,
  SellerProductApiDto,
  SellerProfileApiDto,
  SellerStoreApiDto,
} from '../models/seller-workspace-api.model';

@Injectable({ providedIn: 'root' })
export class RegaliaSellerWorkspaceApiService {
  private readonly http = inject(HttpClient);

  getProfile(): Observable<SellerProfileApiDto> {
    return this.http
      .get<ApiResponse<SellerProfileApiDto>>(API_ENDPOINTS.seller.profile)
      .pipe(map((response) => response.data));
  }

  createProfile(): Observable<SellerProfileApiDto> {
    return this.http
      .post<ApiResponse<SellerProfileApiDto>>(API_ENDPOINTS.seller.profile, {})
      .pipe(map((response) => response.data));
  }

  getStores(): Observable<SellerStoreApiDto[]> {
    return this.http
      .get<ApiResponse<SellerStoreApiDto[]>>(API_ENDPOINTS.seller.stores)
      .pipe(map((response) => response.data ?? []));
  }

  getStoreById(storeId: number): Observable<SellerStoreApiDto> {
    return this.http
      .get<ApiResponse<SellerStoreApiDto>>(API_ENDPOINTS.seller.storeById(storeId))
      .pipe(map((response) => response.data));
  }

  getProductsByStore(storeId: number): Observable<SellerProductApiDto[]> {
    return this.http
      .get<ApiResponse<SellerProductApiDto[]>>(API_ENDPOINTS.seller.productsByStore(storeId))
      .pipe(map((response) => response.data ?? []));
  }

  getOrders(): Observable<SellerOrderSummaryApiDto[]> {
    return this.http
      .get<ApiResponse<SellerOrderSummaryApiDto[]>>(API_ENDPOINTS.seller.orders)
      .pipe(map((response) => response.data ?? []));
  }

  getOrdersByStore(storeId: number): Observable<SellerOrderSummaryApiDto[]> {
    return this.http
      .get<ApiResponse<SellerOrderSummaryApiDto[]>>(API_ENDPOINTS.seller.ordersByStore(storeId))
      .pipe(map((response) => response.data ?? []));
  }

  getOrderById(orderId: number): Observable<SellerOrderDetailApiDto> {
    return this.http
      .get<ApiResponse<SellerOrderDetailApiDto>>(API_ENDPOINTS.seller.orderById(orderId))
      .pipe(map((response) => response.data));
  }
}
