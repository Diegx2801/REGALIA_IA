import { Injectable, inject } from '@angular/core';
import { RegaliaService } from '../../../core/services/data-access/regalia/regalia.service';
import {
  FixedPriceProduct,
  RegaliaCategory,
  RegaliaSeller,
  RegaliaRequest,
} from '../../../shared/models/regalia.model';
import {
  InterpretacionBuilder,
  RecomendacionProductoBuilder,
  ResultadoRecomendacionesBuilder,
} from '../models/builder.model';

@Injectable({ providedIn: 'root' })
export class BuilderFlowService {
  private readonly regaliaService = inject(RegaliaService);

  obtenerOcasiones() {
    return this.regaliaService.getOccasions();
  }

  obtenerRecomendaciones(
    solicitud: RegaliaRequest,
  ): ResultadoRecomendacionesBuilder {
    const interpretacion = this.interpretarSolicitud(solicitud);
    const vendedores = this.regaliaService.getSellers();
    const recomendaciones = this.regaliaService
      .getFixedPriceProducts()
      .map((producto) =>
        this.crearRecomendacion(producto, vendedores, solicitud, interpretacion),
      )
      .filter((recomendacion) => recomendacion.puntaje >= 55)
      .sort((a, b) => b.puntaje - a.puntaje)
      .slice(0, 4);

    return {
      estado: recomendaciones.length > 0 ? 'success' : 'empty',
      recomendaciones,
      mensaje:
        recomendaciones.length > 0
          ? `${recomendaciones.length} productos compatibles encontrados.`
          : 'No encontramos productos compatibles con esos filtros.',
    };
  }

  private crearRecomendacion(producto: FixedPriceProduct,vendedores: RegaliaSeller[],solicitud: RegaliaRequest,interpretacion: InterpretacionBuilder,): RecomendacionProductoBuilder {
    const vendedor = vendedores.find((item) => item.id === producto.sellerId) ?? null;
    const puntaje = this.calcularPuntaje(producto, vendedor, solicitud, interpretacion.category);
    const reserva = this.regaliaService.calculateReservationBreakdown(producto.price);

    return {
      producto,
      vendedor,
      puntaje,
      motivo: this.crearMotivo(producto, solicitud, interpretacion.category),
      interpretacion: {...interpretacion,budgetFit: producto.price <= solicitud.budget ? 'dentro del presupuesto' : 'requiere ajuste',
      },
      reserva,
    };
  }

  private interpretarSolicitud(solicitud: RegaliaRequest): InterpretacionBuilder {
    return {
      category: this.inferirCategoria(solicitud),
      occasion: solicitud.occasion,
      style: solicitud.style || 'personalizado',
      urgency: solicitud.urgent ? 'alta' : 'normal',
      budgetFit: 'por evaluar',
    };
  }

  private inferirCategoria(solicitud: RegaliaRequest): RegaliaCategory {
    const necesidad = this.normalizarTexto(solicitud.need);

    if (necesidad.includes('flor') || necesidad.includes('ramo')) return 'Arreglos florales';
    if (
      necesidad.includes('torta') ||
      necesidad.includes('cupcake') ||
      necesidad.includes('dulce')
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

    return solicitud.occasion === 'Evento corporativo' ? 'Servicios creativos' : 'Cajas sorpresa';
  }

  private calcularPuntaje(
    producto: FixedPriceProduct,
    vendedor: RegaliaSeller | null,
    solicitud: RegaliaRequest,
    categoria: RegaliaCategory,
  ): number {
    const textoSolicitud = this.normalizarTexto(`${solicitud.need} ${solicitud.style}`);
    const textoProducto = this.normalizarTexto(
      `${producto.title} ${producto.shortDescription} ${producto.description} ${producto.badges.join(' ')} ${producto.personalization}`,
    );
    const categoriaScore = producto.sellerCategory === categoria ? 30 : 8;
    const ocasionScore = producto.occasion === solicitud.occasion ? 22 : 5;
    const presupuestoScore = producto.price <= solicitud.budget ? 18 : 6;
    const textoScore = textoProducto
      .split(' ')
      .some((palabra) => palabra.length > 4 && textoSolicitud.includes(palabra))
      ? 10
      : 4;
    const urgenciaScore =
      solicitud.urgent && this.normalizarTexto(producto.deliveryTime).includes('mismo') ? 10 : 6;
    const reputacionScore = vendedor ? Math.round(vendedor.reputation / 10) : 6;
    const verificadoScore = producto.verified ? 4 : 0;

    return Math.min(
      99,
      categoriaScore +
        ocasionScore +
        presupuestoScore +
        textoScore +
        urgenciaScore +
        reputacionScore +
        verificadoScore,
    );
  }

  private crearMotivo(
    producto: FixedPriceProduct,
    solicitud: RegaliaRequest,
    categoria: RegaliaCategory,
  ): string {
    if (producto.sellerCategory === categoria && producto.occasion === solicitud.occasion) {
      return `Coincide con la categoría detectada, está pensado para ${solicitud.occasion.toLowerCase()} y tiene precio fijo para reservar.`;
    }

    return 'Puede resolver la solicitud por estilo, disponibilidad y precio, aunque conviene validar detalles finales.';
  }

  private normalizarTexto(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }
}
