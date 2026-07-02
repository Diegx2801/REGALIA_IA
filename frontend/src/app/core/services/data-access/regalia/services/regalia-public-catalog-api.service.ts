import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_ENDPOINTS } from '../../../../config/api.config';
import { ApiResponse } from '../../../../../shared/models/api-response.model';
import {
  FixedPriceProduct,
  RegaliaCategory,
  RegaliaOccasion,
} from '../../../../../shared/models/regalia.model';
import { PublicProductApiDto, PublicProductImageApiDto } from '../models/public-catalog-api.model';
import { normalizeRegaliaText } from '../utils/regalia-text.util';

const FALLBACK_PRODUCT_IMAGE = '/images/regalia-hero-gift.png';

@Injectable({ providedIn: 'root' })
export class RegaliaPublicCatalogApiService {
  private readonly http = inject(HttpClient);

  // Servicio de datos: consume el backend por GET y adapta la respuesta al modelo del frontend.
  getPublicProducts(): Observable<FixedPriceProduct[]> {
    return this.http
      .get<ApiResponse<PublicProductApiDto[]>>(API_ENDPOINTS.marketplace.products)
      .pipe(map((response) => (response.data ?? []).map((product) => this.toProduct(product))));
  }

  getPublicProductById(productId: number): Observable<FixedPriceProduct> {
    return this.http
      .get<ApiResponse<PublicProductApiDto>>(API_ENDPOINTS.marketplace.productById(productId))
      .pipe(map((response) => this.toProduct(response.data)));
  }

  private toProduct(product: PublicProductApiDto): FixedPriceProduct {
    const productName = product.nombre?.trim() || 'Producto REGALIA';
    const providerName = product.nombreTienda?.trim() || 'Proveedor REGALIA';
    const productType = product.tipoProducto?.trim() || 'Producto listo';
    const category = this.mapCategory(productType);
    const description =
      product.descripcion?.trim() || 'Detalle disponible para reservar en REGALIA.';
    const stock = product.stock ?? 0;

    return {
      id: product.idProducto,
      title: productName,
      provider: providerName,
      providerId: product.idTienda,
      providerCategory: category,
      occasion: this.inferOccasion(`${productName} ${description}`),
      price: Number(product.precio ?? 0),
      rating: 4.8,
      reviews: 0,
      imageUrl: this.resolveProductImage(product.imagenes),
      imagePosition: '68% 48%',
      verified: true,
      badges: this.buildBadges(productType, stock),
      shortDescription: description,
      description,
      includes: [
        'Producto publicado por proveedor local',
        'Coordinación directa desde REGALIA',
        'Reserva según disponibilidad del vendedor',
      ],
      deliveryTime: 'Coordinar con proveedor',
      stockStatus: stock > 0 ? `Disponible (${stock})` : 'Agotado',
      personalization: 'Personalización según coordinación',
      maxQuantity: Math.max(1, Math.min(stock || 1, 10)),
    };
  }

  private resolveProductImage(images: PublicProductImageApiDto[] | null): string {
    const sortedImages = [...(images ?? [])].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
    const imageUrl = sortedImages.find((image) => Boolean(image.urlImagen?.trim()))?.urlImagen;

    return imageUrl?.trim() || FALLBACK_PRODUCT_IMAGE;
  }

  private buildBadges(productType: string, stock: number): string[] {
    if (stock <= 0) return ['Agotado'];

    const normalizedType = this.toTitleCase(productType);
    return [normalizedType || 'Producto listo'];
  }

  private mapCategory(productType: string): RegaliaCategory {
    const normalizedType = normalizeRegaliaText(productType);

    if (normalizedType.includes('box') || normalizedType.includes('pack')) return 'Cajas sorpresa';
    if (normalizedType.includes('flor') || normalizedType.includes('arreglo')) {
      return 'Arreglos florales';
    }
    if (normalizedType.includes('comestible') || normalizedType.includes('torta')) {
      return 'Repostería personalizada';
    }
    if (normalizedType.includes('sublim')) return 'Sublimados';
    if (normalizedType.includes('decor')) return 'Decoración de eventos';
    if (normalizedType.includes('accesorio') || normalizedType.includes('manual')) {
      return 'Manualidades';
    }

    return 'Servicios creativos';
  }

  private inferOccasion(searchableText: string): RegaliaOccasion {
    const normalizedText = normalizeRegaliaText(searchableText);

    if (normalizedText.includes('mama') || normalizedText.includes('madre')) {
      return 'Día de la Madre';
    }
    if (normalizedText.includes('aniversario') || normalizedText.includes('romant')) {
      return 'Aniversario';
    }
    if (normalizedText.includes('gradu')) return 'Graduación';
    if (normalizedText.includes('navidad')) return 'Navidad';
    if (normalizedText.includes('san valentin') || normalizedText.includes('pareja')) {
      return 'San Valentín';
    }
    if (normalizedText.includes('condol')) return 'Condolencias';
    if (normalizedText.includes('corporativo') || normalizedText.includes('empresa')) {
      return 'Evento corporativo';
    }

    return 'Cumpleaños';
  }

  private toTitleCase(value: string): string {
    return value
      .toLocaleLowerCase('es-PE')
      .split(' ')
      .filter(Boolean)
      .map((word) => `${word.charAt(0).toLocaleUpperCase('es-PE')}${word.slice(1)}`)
      .join(' ');
  }
}
