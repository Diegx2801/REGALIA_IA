import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { RegaliaService } from '../../../core/services/data-access/regalia/regalia.service';
import {
  FixedPriceProduct,
  RegaliaCategory,
  RegaliaOccasion,
} from '../../../shared/models/regalia.model';
import {
  BuilderIAProductoBackend,
  InterpretacionConstructor,
  RecomendacionProductoConstructor,
  ResultadoRecomendacionesConstructor,
  SolicitudBuilderIAConstructor,
} from '../models/builder.model';
import { BuilderApiService } from './builder-api.service';

@Injectable({ providedIn: 'root' })
export class BuilderFlowService {
  private static readonly OCASION_BASE: RegaliaOccasion = 'Cumpleaños';
  private static readonly ESTILO_BASE = 'personalizado';

  private readonly regaliaService = inject(RegaliaService);
  private readonly builderApiService = inject(BuilderApiService);

  /**
   * Consulta el módulo builderIA del backend y adapta su contrato al modelo visual del builder.
   */
  obtenerRecomendaciones(
    solicitud: SolicitudBuilderIAConstructor,
  ): Observable<ResultadoRecomendacionesConstructor> {
    const interpretacion = this.interpretarSolicitud(solicitud);

    return this.builderApiService.recomendarProductos(solicitud).pipe(
      map((respuesta) => {
        const recomendaciones = respuesta.productosRecomendados.map((producto, index) =>
          this.crearRecomendacion(producto, interpretacion, respuesta.respuesta, index),
        );

        return {
          estado: recomendaciones.length > 0 ? 'success' : 'empty',
          recomendaciones,
          mensaje:
            recomendaciones.length > 0
              ? respuesta.respuesta
              : respuesta.respuesta || 'No encontramos productos compatibles con esos filtros.',
        };
      }),
    );
  }

  private crearRecomendacion(
    productoBackend: BuilderIAProductoBackend,
    interpretacion: InterpretacionConstructor,
    respuestaIA: string,
    index: number,
  ): RecomendacionProductoConstructor {
    const producto = this.toProductoConstructor(productoBackend);
    const reserva = this.regaliaService.calculateReservationBreakdown(producto.price);

    return {
      producto,
      vendedor: null,
      puntaje: Math.max(70, 96 - index * 5),
      motivo: respuestaIA || 'Producto recomendado por el asistente IA de REGALIA.',
      interpretacion: {
        ...interpretacion,
        categoria: producto.sellerCategory,
        ajustePresupuesto: 'por coordinar',
      },
      reserva,
    };
  }

  private toProductoConstructor(productoBackend: BuilderIAProductoBackend): FixedPriceProduct {
    const precio = Number(productoBackend.precio);
    const tipoProducto = productoBackend.tipoProducto || 'Producto recomendado';

    return {
      id: productoBackend.idProducto,
      title: productoBackend.nombre,
      seller: productoBackend.nombreTienda,
      sellerId: productoBackend.idTienda,
      sellerCategory: this.mapearCategoria(tipoProducto),
      occasion: BuilderFlowService.OCASION_BASE,
      price: Number.isFinite(precio) ? precio : 0,
      rating: 4.8,
      reviews: 0,
      imageUrl: '/images/regalia-hero-gift.png',
      imagePosition: '50% 50%',
      verified: true,
      badges: [tipoProducto],
      shortDescription: productoBackend.descripcion || 'Producto recomendado por REGALIA.',
      description: productoBackend.descripcion || 'Producto recomendado por el asistente IA de REGALIA.',
      includes: ['Producto seleccionado', 'Coordinación con vendedor', 'Reserva desde REGALIA'],
      deliveryTime: 'Entrega coordinada con vendedor',
      stockStatus:
        productoBackend.stock > 0
          ? `Stock disponible: ${productoBackend.stock}`
          : 'Consultar disponibilidad',
      personalization: 'Personalización según disponibilidad del vendedor',
      maxQuantity: Math.max(productoBackend.stock || 1, 1),
    };
  }

  /**
   * Resume la solicitud del usuario en criterios simples que la UI muestra como interpretación.
   */
  private interpretarSolicitud(solicitud: SolicitudBuilderIAConstructor): InterpretacionConstructor {
    return {
      categoria: this.inferirCategoria(solicitud),
      ocasion: BuilderFlowService.OCASION_BASE,
      estilo: BuilderFlowService.ESTILO_BASE,
      urgencia: 'normal',
      ajustePresupuesto: 'por evaluar',
    };
  }

  /**
   * Detecta una categoría probable a partir de palabras clave de la necesidad.
   */
  private inferirCategoria(solicitud: SolicitudBuilderIAConstructor): RegaliaCategory {
    const necesidad = this.normalizarTexto(solicitud.busqueda);

    if (necesidad.includes('flor') || necesidad.includes('ramo')) return 'Arreglos florales';
    if (
      necesidad.includes('torta') ||
      necesidad.includes('cupcake') ||
      necesidad.includes('dulce') ||
      necesidad.includes('chocolate')
    ) {
      return 'Repostería personalizada';
    }
    if (necesidad.includes('caja') || necesidad.includes('box') || necesidad.includes('desayuno')) {
      return 'Cajas sorpresa';
    }
    if (necesidad.includes('taza') || necesidad.includes('polo') || necesidad.includes('sublim')) {
      return 'Sublimados';
    }
    if (necesidad.includes('madera') || necesidad.includes('grabado')) {
      return 'Carpintería personalizada';
    }
    if (necesidad.includes('decor') || necesidad.includes('evento')) {
      return 'Decoración de eventos';
    }
    if (necesidad.includes('foto') || necesidad.includes('diseno')) {
      return 'Servicios creativos';
    }

    return 'Cajas sorpresa';
  }

  private mapearCategoria(tipoProducto: string): RegaliaCategory {
    const tipoNormalizado = this.normalizarTexto(tipoProducto);

    if (tipoNormalizado.includes('floral')) return 'Arreglos florales';
    if (tipoNormalizado.includes('box') || tipoNormalizado.includes('pack')) return 'Cajas sorpresa';
    if (tipoNormalizado.includes('comestible')) return 'Repostería personalizada';
    if (tipoNormalizado.includes('accesorio') || tipoNormalizado.includes('personalizado')) return 'Sublimados';

    return 'Cajas sorpresa';
  }

  private normalizarTexto(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }
}
