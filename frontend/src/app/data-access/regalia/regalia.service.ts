import { Injectable } from '@angular/core';
import {
  MatchRecommendation,
  ProviderFilter,
  RegaliaCategory,
  RegaliaOccasion,
  RegaliaOrder,
  RegaliaProvider,
  RegaliaRequest,
  ReservationBreakdown,
} from '../../shared/models/regalia.model';

@Injectable({ providedIn: 'root' })
export class RegaliaService {
  private readonly categories: RegaliaCategory[] = [
    'Cajas sorpresa',
    'Arreglos florales',
    'Reposteria personalizada',
    'Manualidades',
    'Sublimados',
    'Decoracion de eventos',
    'Carpinteria personalizada',
    'Servicios creativos',
  ];

  private readonly occasions: RegaliaOccasion[] = [
    'Cumpleanos',
    'Graduacion',
    'San Valentin',
    'Dia de la Madre',
    'Navidad',
    'Aniversario',
    'Evento corporativo',
  ];

  private readonly providers: RegaliaProvider[] = [
    {
      id: 1,
      businessName: 'Dulce Detalle Trujillo',
      ownerName: 'Camila Rojas',
      category: 'Reposteria personalizada',
      district: 'Victor Larco',
      whatsapp: '999 214 850',
      priceFrom: 65,
      priceTo: 180,
      deliveryTime: '24 a 48 horas',
      availability: 'Disponible esta semana',
      paymentMethods: ['Yape', 'Plin', 'Transferencia'],
      styles: ['elegante', 'minimalista', 'premium'],
      occasions: ['Cumpleanos', 'Graduacion', 'Aniversario'],
      rating: 4.9,
      reviews: 86,
      reputation: 96,
      distanceKm: 2.4,
      featured: true,
      portfolio: ['Tortas tematicas', 'Cupcakes premium', 'Box dulce personalizado'],
      description: 'Reposteria fina para regalos personalizados con presentacion cuidada y entrega coordinada.',
      reviewSummary: { quality: 4.9, punctuality: 4.8, communication: 4.9, presentation: 5, value: 4.7 },
    },
    {
      id: 2,
      businessName: 'Floralia Studio',
      ownerName: 'Renata Campos',
      category: 'Arreglos florales',
      district: 'Centro Historico',
      whatsapp: '944 681 203',
      priceFrom: 45,
      priceTo: 160,
      deliveryTime: 'Mismo dia',
      availability: 'Cupos limitados hoy',
      paymentMethods: ['Yape', 'Efectivo'],
      styles: ['romantico', 'natural', 'sobrio'],
      occasions: ['San Valentin', 'Dia de la Madre', 'Aniversario', 'Graduacion'],
      rating: 4.8,
      reviews: 124,
      reputation: 94,
      distanceKm: 1.7,
      featured: true,
      portfolio: ['Ramos premium', 'Arreglos en caja', 'Flores con tarjeta'],
      description: 'Arreglos florales modernos con opciones express para fechas especiales en Trujillo.',
      reviewSummary: { quality: 4.8, punctuality: 4.9, communication: 4.7, presentation: 4.9, value: 4.6 },
    },
    {
      id: 3,
      businessName: 'Caja Bonita',
      ownerName: 'Valeria Leon',
      category: 'Cajas sorpresa',
      district: 'California',
      whatsapp: '976 340 518',
      priceFrom: 55,
      priceTo: 220,
      deliveryTime: '24 horas',
      availability: 'Disponible',
      paymentMethods: ['Yape', 'Plin', 'Tarjeta'],
      styles: ['tierno', 'juvenil', 'colorido'],
      occasions: ['Cumpleanos', 'Graduacion', 'San Valentin', 'Navidad'],
      rating: 4.7,
      reviews: 71,
      reputation: 91,
      distanceKm: 3.2,
      featured: false,
      portfolio: ['Desayunos sorpresa', 'Box graduacion', 'Box romantico'],
      description: 'Cajas sorpresa con curaduria local, tarjetas y personalizacion por ocasion.',
      reviewSummary: { quality: 4.7, punctuality: 4.6, communication: 4.8, presentation: 4.8, value: 4.5 },
    },
    {
      id: 4,
      businessName: 'Sublima Norte',
      ownerName: 'Marco Paredes',
      category: 'Sublimados',
      district: 'La Esperanza',
      whatsapp: '901 445 309',
      priceFrom: 25,
      priceTo: 140,
      deliveryTime: '48 a 72 horas',
      availability: 'Disponible',
      paymentMethods: ['Yape', 'Transferencia'],
      styles: ['corporativo', 'personalizado', 'practico'],
      occasions: ['Cumpleanos', 'Graduacion', 'Evento corporativo', 'Navidad'],
      rating: 4.5,
      reviews: 53,
      reputation: 86,
      distanceKm: 5.1,
      featured: false,
      portfolio: ['Tazas personalizadas', 'Polos', 'Llaveros', 'Tomatodos'],
      description: 'Sublimados y merchandising personalizado para regalos practicos y campanas locales.',
      reviewSummary: { quality: 4.5, punctuality: 4.4, communication: 4.6, presentation: 4.3, value: 4.8 },
    },
    {
      id: 5,
      businessName: 'Madera & Detalle',
      ownerName: 'Hector Salinas',
      category: 'Carpinteria personalizada',
      district: 'Moche',
      whatsapp: '955 760 118',
      priceFrom: 80,
      priceTo: 350,
      deliveryTime: '3 a 5 dias',
      availability: 'Agenda abierta',
      paymentMethods: ['Transferencia', 'Efectivo'],
      styles: ['rustico', 'elegante', 'artesanal'],
      occasions: ['Aniversario', 'Dia de la Madre', 'Navidad', 'Evento corporativo'],
      rating: 4.8,
      reviews: 39,
      reputation: 92,
      distanceKm: 7.4,
      featured: true,
      portfolio: ['Cajas de madera', 'Letreros pequenos', 'Organizadores personalizados'],
      description: 'Piezas pequenas en madera con grabado, acabado artesanal y coordinacion por reserva.',
      reviewSummary: { quality: 4.9, punctuality: 4.6, communication: 4.7, presentation: 4.8, value: 4.6 },
    },
    {
      id: 6,
      businessName: 'Momentos Deco',
      ownerName: 'Lucia Benites',
      category: 'Decoracion de eventos',
      district: 'El Golf',
      whatsapp: '988 417 006',
      priceFrom: 120,
      priceTo: 650,
      deliveryTime: '2 a 4 dias',
      availability: 'Disponible con reserva',
      paymentMethods: ['Yape', 'Transferencia', 'Tarjeta'],
      styles: ['premium', 'fotografico', 'elegante'],
      occasions: ['Cumpleanos', 'Graduacion', 'San Valentin', 'Evento corporativo'],
      rating: 4.9,
      reviews: 58,
      reputation: 97,
      distanceKm: 2.9,
      featured: true,
      portfolio: ['Mini setups', 'Decoracion de mesa', 'Fondos fotograficos'],
      description: 'Decoracion para celebraciones pequenas con foco en fotografia, puntualidad y montaje limpio.',
      reviewSummary: { quality: 4.9, punctuality: 4.9, communication: 4.8, presentation: 5, value: 4.5 },
    },
  ];

  private readonly orders: RegaliaOrder[] = [
    {
      id: 1001,
      clientName: 'Andrea M.',
      providerName: 'Floralia Studio',
      category: 'Arreglos florales',
      occasion: 'Aniversario',
      status: 'Pedido aceptado',
      total: 120,
      reservation: 12,
      commission: 3.6,
      dueDate: 'Sabado 6:00 p.m.',
    },
    {
      id: 1002,
      clientName: 'Carlos P.',
      providerName: 'Dulce Detalle Trujillo',
      category: 'Reposteria personalizada',
      occasion: 'Graduacion',
      status: 'En proceso',
      total: 150,
      reservation: 15,
      commission: 4.5,
      dueDate: 'Viernes 4:00 p.m.',
    },
    {
      id: 1003,
      clientName: 'Maria C.',
      providerName: 'Caja Bonita',
      category: 'Cajas sorpresa',
      occasion: 'Cumpleanos',
      status: 'Listo',
      total: 95,
      reservation: 10,
      commission: 3,
      dueDate: 'Hoy 7:00 p.m.',
    },
  ];

  getCategories(): RegaliaCategory[] {
    return this.categories;
  }

  getOccasions(): RegaliaOccasion[] {
    return this.occasions;
  }

  getProviders(): RegaliaProvider[] {
    return this.providers;
  }

  getOrders(): RegaliaOrder[] {
    return this.orders;
  }

  filterProviders(filters: ProviderFilter): RegaliaProvider[] {
    const search = filters.search.trim().toLowerCase();

    return this.providers.filter((provider) => {
      const matchesSearch =
        search.length === 0 ||
        provider.businessName.toLowerCase().includes(search) ||
        provider.description.toLowerCase().includes(search) ||
        provider.styles.some((style) => style.toLowerCase().includes(search));

      const matchesCategory = filters.category === 'Todas' || provider.category === filters.category;
      const matchesOccasion = filters.occasion === 'Todas' || provider.occasions.includes(filters.occasion);
      const matchesPrice = provider.priceFrom <= filters.maxPrice;
      const matchesAvailability = !filters.availableOnly || provider.availability.toLowerCase().includes('disponible');

      return matchesSearch && matchesCategory && matchesOccasion && matchesPrice && matchesAvailability;
    });
  }

  matchRequest(request: RegaliaRequest): MatchRecommendation[] {
    const interpretedCategory = this.inferCategory(request);

    return this.providers
      .map((provider) => {
        const score = this.scoreProvider(provider, request, interpretedCategory);
        const estimatedOrder = Math.min(Math.max(request.budget, provider.priceFrom), provider.priceTo);
        const reservation = Math.max(10, Math.round(estimatedOrder * 0.1));
        const platformCommission = Math.round(reservation * 0.3 * 10) / 10;
        const providerCredit = reservation - platformCommission;

        return {
          provider,
          score,
          reason: this.reasonFor(provider, request, interpretedCategory),
          interpretedNeed: {
            category: interpretedCategory,
            occasion: request.occasion,
            style: request.style || 'personalizado',
            urgency: request.urgent ? 'alta' : 'normal',
            budgetFit: estimatedOrder <= request.budget ? 'dentro del presupuesto' : 'requiere ajuste',
          },
          reservation: { estimatedOrder, reservation, platformCommission, providerCredit },
        };
      })
      .filter((recommendation) => recommendation.score >= 60)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
  }

  getAdminMetrics(): Array<{ label: string; value: string; hint: string }> {
    const confirmed = this.orders.length;
    const commissions = this.orders.reduce((sum, order) => sum + order.commission, 0);
    const reserved = this.orders.reduce((sum, order) => sum + order.reservation, 0);

    return [
      { label: 'Pedidos activos', value: String(confirmed), hint: 'solicitudes con reserva registrada' },
      { label: 'Reservas captadas', value: `S/ ${reserved}`, hint: 'senal procesada por REGALIA' },
      { label: 'Comisiones', value: `S/ ${commissions.toFixed(1)}`, hint: 'ingreso estimado de plataforma' },
      { label: 'Proveedores', value: String(this.providers.length), hint: 'perfiles visibles en Trujillo' },
    ];
  }

  private inferCategory(request: RegaliaRequest): RegaliaCategory {
    const need = request.need.toLowerCase();

    if (need.includes('flor') || need.includes('ramo')) return 'Arreglos florales';
    if (need.includes('torta') || need.includes('cupcake') || need.includes('dulce')) return 'Reposteria personalizada';
    if (need.includes('caja') || need.includes('desayuno')) return 'Cajas sorpresa';
    if (need.includes('taza') || need.includes('polo') || need.includes('sublim')) return 'Sublimados';
    if (need.includes('madera') || need.includes('grabado')) return 'Carpinteria personalizada';
    if (need.includes('decor') || need.includes('evento')) return 'Decoracion de eventos';
    if (need.includes('foto') || need.includes('dise')) return 'Servicios creativos';

    return request.occasion === 'Evento corporativo' ? 'Servicios creativos' : 'Cajas sorpresa';
  }

  private scoreProvider(provider: RegaliaProvider, request: RegaliaRequest, category: RegaliaCategory): number {
    const categoryScore = provider.category === category ? 30 : 8;
    const occasionScore = provider.occasions.includes(request.occasion) ? 20 : 4;
    const budgetScore = request.budget >= provider.priceFrom ? 18 : 6;
    const styleScore = provider.styles.some((style) => request.style.toLowerCase().includes(style)) ? 12 : 5;
    const urgencyScore = request.urgent && provider.deliveryTime.toLowerCase().includes('mismo') ? 10 : 6;
    const reputationScore = Math.round(provider.reputation / 10);

    return Math.min(99, categoryScore + occasionScore + budgetScore + styleScore + urgencyScore + reputationScore);
  }

  private reasonFor(provider: RegaliaProvider, request: RegaliaRequest, category: RegaliaCategory): string {
    if (provider.category === category && provider.occasions.includes(request.occasion)) {
      return `Coincide con la categoria detectada, trabaja ${request.occasion.toLowerCase()} y encaja con el presupuesto referencial.`;
    }

    return 'Puede resolver la solicitud por estilo, reputacion y disponibilidad, aunque requiere validar detalles finales.';
  }
}
