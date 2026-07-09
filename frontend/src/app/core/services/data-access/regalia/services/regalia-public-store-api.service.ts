import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_ENDPOINTS } from '../../../../config/api.config';
import { ApiResponse } from '../../../../../shared/models/api-response.model';
import {
  MarketplaceStoreCard,
  PublicStoreApiDto,
} from '../models/public-store-api.model';
import { normalizeRegaliaText } from '../utils/regalia-text.util';

@Injectable({ providedIn: 'root' })
export class RegaliaPublicStoreApiService {
  private readonly http = inject(HttpClient);

  getPublicStores(): Observable<MarketplaceStoreCard[]> {
    return this.http
      .get<ApiResponse<PublicStoreApiDto[]>>(API_ENDPOINTS.marketplace.stores)
      .pipe(map((response) => (response.data ?? []).map((store) => this.toStoreCard(store))));
  }

  filterStores(
    stores: MarketplaceStoreCard[],
    filters: { search: string; category: string },
  ): MarketplaceStoreCard[] {
    const search = normalizeRegaliaText(filters.search);
    const category = normalizeRegaliaText(filters.category);

    return stores.filter((store) => {
      const searchableText = normalizeRegaliaText(
        `${store.businessName} ${store.description} ${store.districtLabel} ${store.categories.join(' ')}`,
      );
      const matchesSearch = search.length === 0 || searchableText.includes(search);
      const matchesCategory =
        category === 'todas' ||
        store.categories.some((item) => normalizeRegaliaText(item).includes(category));

      return matchesSearch && matchesCategory;
    });
  }

  private toStoreCard(store: PublicStoreApiDto): MarketplaceStoreCard {
    const categories =
      store.rubros
        ?.map((rubro) => rubro.nombre?.trim() ?? '')
        .filter((name) => name.length > 0) ?? [];

    return {
      id: store.idTienda,
      businessName: store.nombre?.trim() || `Tienda ${store.idTienda}`,
      description:
        store.descripcion?.trim() || 'Tienda visible en el marketplace de REGALIA.',
      districtLabel: store.direccionReferencia?.trim() || 'Ubicacion por coordinar',
      reviewStatus: store.estadoRevision?.trim() || 'SIN_ESTADO',
      formalized: Boolean(store.tiendaFormalizada),
      categories: categories.length > 0 ? categories : ['Sin rubro'],
    };
  }
}
