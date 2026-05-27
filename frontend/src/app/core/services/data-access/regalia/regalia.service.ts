import { Injectable } from '@angular/core';
import {
  AdminMetric,
  FeaturedProduct,
  MatchRecommendation,
  OccasionShortcut,
  OrderStatus,
  ProviderFilter,
  RegaliaCategory,
  RegaliaOccasion,
  RegaliaOrder,
  RegaliaProvider,
  RegaliaRequest,
  ReservationBreakdown,
} from '../../../../shared/models/regalia.model';

@Injectable({ providedIn: 'root' })
export class RegaliaService {
  private readonly categories: RegaliaCategory[] = [
    'Cajas sorpresa',
    'Arreglos florales',
    'Repostería personalizada',
    'Manualidades',
    'Sublimados',
    'Decoración de eventos',
    'Carpintería personalizada',
    'Servicios creativos',
  ];

  private readonly occasions: RegaliaOccasion[] = [
    'Cumpleaños',
    'Día de la Madre',
    'Aniversario',
    'Graduación',
    'San Valentín',
    'Navidad',
    'Condolencias',
    'Evento corporativo',
  ];

  private readonly orderStatuses: OrderStatus[] = ['Pedido aceptado', 'En proceso', 'Listo', 'Entregado'];

  private readonly occasionShortcuts: OccasionShortcut[] = [
    { id: 'cumpleanos', label: 'Cumpleaños', route: '/catalogo', icon: 'gift' },
    { id: 'madre', label: 'Día de la Madre', route: '/catalogo', icon: 'heart' },
    { id: 'aniversario', label: 'Aniversarios', route: '/catalogo', icon: 'ring' },
    { id: 'graduacion', label: 'Graduación', route: '/catalogo', icon: 'cap' },
    { id: 'condolencias', label: 'Condolencias', route: '/catalogo', icon: 'leaf' },
    { id: 'mas', label: 'Más categorías', route: '/catalogo', icon: 'grid' },
  ];

  private readonly featuredProducts: FeaturedProduct[] = [
    {
      id: 1,
      title: 'Box mamá edición especial',
      provider: 'Bienestar Natural',
      providerCategory: 'Cajas sorpresa',
      priceFrom: 129,
      rating: 4.9,
      reviews: 128,
      imageUrl: '/images/regalia-hero-gift.png',
      imagePosition: '68% 48%',
      verified: true,
    },
    {
      id: 2,
      title: 'Arreglo floral radiante',
      provider: 'Floralia Studio',
      providerCategory: 'Arreglos florales',
      priceFrom: 99,
      rating: 4.8,
      reviews: 96,
      imageUrl: '/images/regalia-hero-gift.png',
      imagePosition: '52% 30%',
      verified: true,
    },
    {
      id: 3,
      title: 'Torta eres única',
      provider: 'Dulce Detalle',
      providerCategory: 'Repostería personalizada',
      priceFrom: 85,
      rating: 4.9,
      reviews: 76,
      imageUrl: '/images/regalia-hero-gift.png',
      imagePosition: '84% 52%',
      verified: true,
    },
    {
      id: 4,
      title: 'Detalle relax personalizado',
      provider: 'Momentos Deco',
      providerCategory: 'Servicios creativos',
      priceFrom: 119,
      rating: 4.8,
      reviews: 64,
      imageUrl: '/images/regalia-hero-gift.png',
      imagePosition: '78% 68%',
      verified: true,
    },
  ];

  private readonly providers: RegaliaProvider[] = [
    {
      id: 1,
      businessName: 'Dulce Detalle Trujillo',
      ownerName: 'Camila Rojas',
      category: 'Repostería personalizada',
      district: 'Víctor Larco',
      whatsapp: '999 214 850',
      priceFrom: 65,
      priceTo: 180,
      deliveryTime: '24 a 48 horas',
      availability: 'Disponible esta semana',
      paymentMethods: ['Yape', 'Plin', 'Transferencia'],
      styles: ['elegante', 'minimalista', 'premium'],
      occasions: ['Cumpleaños', 'Graduación', 'Aniversario'],
      rating: 4.9,
      reviews: 86,
      reputation: 96,
      distanceKm: 2.4,
      featured: true,
      portfolio: ['Tortas temáticas', 'Cupcakes premium', 'Box dulce personalizado'],
      description: 'Repostería fina para regalos personalizados con presentación cuidada y entrega coordinada.',
      reviewSummary: { quality: 4.9, punctuality: 4.8, communication: 4.9, presentation: 5, value: 4.7 },
    },
    {
      id: 2,
      businessName: 'Floralia Studio',
      ownerName: 'Renata Campos',
      category: 'Arreglos florales',
      district: 'Centro Histórico',
      whatsapp: '944 681 203',
      priceFrom: 45,
      priceTo: 160,
      deliveryTime: 'Mismo día',
      availability: 'Cupos limitados hoy',
      paymentMethods: ['Yape', 'Efectivo'],
      styles: ['romántico', 'natural', 'sobrio'],
      occasions: ['San Valentín', 'Día de la Madre', 'Aniversario', 'Graduación', 'Condolencias'],
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
      ownerName: 'Valeria León',
      category: 'Cajas sorpresa',
      district: 'California',
      whatsapp: '976 340 518',
      priceFrom: 55,
      priceTo: 220,
      deliveryTime: '24 horas',
      availability: 'Disponible',
      paymentMethods: ['Yape', 'Plin', 'Tarjeta'],
      styles: ['tierno', 'juvenil', 'colorido'],
      occasions: ['Cumpleaños', 'Graduación', 'San Valentín', 'Navidad'],
      rating: 4.7,
      reviews: 71,
      reputation: 91,
      distanceKm: 3.2,
      featured: false,
      portfolio: ['Desayunos sorpresa', 'Box graduación', 'Box romántico'],
      description: 'Cajas sorpresa con curaduría local, tarjetas y personalización por ocasión.',
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
      styles: ['corporativo', 'personalizado', 'práctico'],
      occasions: ['Cumpleaños', 'Graduación', 'Evento corporativo', 'Navidad'],
      rating: 4.5,
      reviews: 53,
      reputation: 86,
      distanceKm: 5.1,
      featured: false,
      portfolio: ['Tazas personalizadas', 'Polos', 'Llaveros', 'Tomatodos'],
      description: 'Sublimados y merchandising personalizado para regalos prácticos y campañas locales.',
      reviewSummary: { quality: 4.5, punctuality: 4.4, communication: 4.6, presentation: 4.3, value: 4.8 },
    },
    {
      id: 5,
      businessName: 'Madera & Detalle',
      ownerName: 'Héctor Salinas',
      category: 'Carpintería personalizada',
      district: 'Moche',
      whatsapp: '955 760 118',
      priceFrom: 80,
      priceTo: 350,
      deliveryTime: '3 a 5 días',
      availability: 'Agenda abierta',
      paymentMethods: ['Transferencia', 'Efectivo'],
      styles: ['rústico', 'elegante', 'artesanal'],
      occasions: ['Aniversario', 'Día de la Madre', 'Navidad', 'Evento corporativo'],
      rating: 4.8,
      reviews: 39,
      reputation: 92,
      distanceKm: 7.4,
      featured: true,
      portfolio: ['Cajas de madera', 'Letreros pequeños', 'Organizadores personalizados'],
      description: 'Piezas pequeñas en madera con grabado, acabado artesanal y coordinación por reserva.',
      reviewSummary: { quality: 4.9, punctuality: 4.6, communication: 4.7, presentation: 4.8, value: 4.6 },
    },
    {
      id: 6,
      businessName: 'Momentos Deco',
      ownerName: 'Lucía Benites',
      category: 'Decoración de eventos',
      district: 'El Golf',
      whatsapp: '988 417 006',
      priceFrom: 120,
      priceTo: 650,
      deliveryTime: '2 a 4 días',
      availability: 'Disponible con reserva',
      paymentMethods: ['Yape', 'Transferencia', 'Tarjeta'],
      styles: ['premium', 'fotográfico', 'elegante'],
      occasions: ['Cumpleaños', 'Graduación', 'San Valentín', 'Evento corporativo'],
      rating: 4.9,
      reviews: 58,
      reputation: 97,
      distanceKm: 2.9,
      featured: true,
      portfolio: ['Mini setups', 'Decoración de mesa', 'Fondos fotográficos'],
      description: 'Decoración para celebraciones pequeñas con foco en fotografía, puntualidad y montaje limpio.',
      reviewSummary: { quality: 4.9, punctuality: 4.9, communication: 4.8, presentation: 5, value: 4.5 },
    },
  ];

  private readonly orderDrafts: Array<Omit<RegaliaOrder, 'reservation' | 'commission'>> = [
    {
      id: 1001,
      clientName: 'Andrea M.',
      providerName: 'Floralia Studio',
      category: 'Arreglos florales',
      occasion: 'Aniversario',
      status: 'Pedido aceptado',
      total: 120,
      dueDate: 'Sábado 6:00 p.m.',
    },
    {
      id: 1002,
      clientName: 'Carlos P.',
      providerName: 'Dulce Detalle Trujillo',
      category: 'Repostería personalizada',
      occasion: 'Graduación',
      status: 'En proceso',
      total: 150,
      dueDate: 'Viernes 4:00 p.m.',
    },
    {
      id: 1003,
      clientName: 'María C.',
      providerName: 'Caja Bonita',
      category: 'Cajas sorpresa',
      occasion: 'Cumpleaños',
      status: 'Listo',
      total: 95,
      dueDate: 'Hoy 7:00 p.m.',
    },
  ];

  getCategories(): RegaliaCategory[] {
    return [...this.categories];
  }

  getOccasions(): RegaliaOccasion[] {
    return [...this.occasions];
  }

  getOrderStatuses(): OrderStatus[] {
    return [...this.orderStatuses];
  }

  getOccasionShortcuts(): OccasionShortcut[] {
    return [...this.occasionShortcuts];
  }

  getFeaturedProducts(): FeaturedProduct[] {
    return [...this.featuredProducts];
  }

  getProviders(): RegaliaProvider[] {
    return [...this.providers];
  }

  getOrders(): RegaliaOrder[] {
    return this.orderDrafts.map((order) => {
      const breakdown = this.calculateReservationBreakdown(order.total);

      return {
        ...order,
        reservation: breakdown.reservation,
        commission: breakdown.platformCommission,
      };
    });
  }

  /**
   * Calcula el desglose de reserva para una solicitud confirmada.
   *
   * Regla actual del MVP:
   * - El cliente paga el 10% del total estimado del pedido como reserva.
   * - REGALIA retiene el 30% de esa reserva como comisión de plataforma.
   * - El monto restante se asigna al proveedor como adelanto.
   */
  calculateReservationBreakdown(totalAmount: number): ReservationBreakdown {
    const estimatedOrder = this.roundMoney(Math.max(totalAmount, 0));
    const reservation = this.roundMoney(estimatedOrder * 0.1);
    const platformCommission = this.roundMoney(reservation * 0.3);
    const providerCredit = this.roundMoney(reservation - platformCommission);

    return { estimatedOrder, reservation, platformCommission, providerCredit };
  }

  /**
   * Filtra perfiles de proveedores para el catálogo usando texto normalizado,
   * evitando que las tildes generen fallos inesperados en la búsqueda.
   */
  filterProviders(filters: ProviderFilter): RegaliaProvider[] {
    const search = this.normalizeText(filters.search);

    return this.providers.filter((provider) => {
      const searchableText = this.normalizeText(
        `${provider.businessName} ${provider.description} ${provider.styles.join(' ')} ${provider.category}`,
      );
      const matchesSearch = search.length === 0 || searchableText.includes(search);
      const matchesCategory = filters.category === 'Todas' || provider.category === filters.category;
      const matchesOccasion = filters.occasion === 'Todas' || provider.occasions.includes(filters.occasion);
      const matchesPrice = provider.priceFrom <= filters.maxPrice;
      const matchesAvailability = !filters.availableOnly || this.normalizeText(provider.availability).includes('disponible');

      return matchesSearch && matchesCategory && matchesOccasion && matchesPrice && matchesAvailability;
    });
  }

  /**
   * Devuelve proveedores compatibles para el constructor manual de solicitudes
   * sin usar el paso simulado de interpretación IA.
   */
  findCompatibleProviders(
    category: RegaliaCategory | 'Todas',
    occasion: RegaliaOccasion,
    budget: number,
  ): RegaliaProvider[] {
    return this.providers
      .filter((provider) => {
        const matchesCategory = category === 'Todas' || provider.category === category;
        const matchesOccasion = provider.occasions.includes(occasion);
        const matchesBudget = provider.priceFrom <= budget;

        return matchesCategory && matchesOccasion && matchesBudget;
      })
      .sort((a, b) => b.reputation - a.reputation)
      .slice(0, 4);
  }

  /**
   * Construye la lista simulada de recomendaciones IA usada por el flujo MVP.
   * Más adelante puede reemplazarse por un servicio real de emparejamiento u ordenamiento.
   */
  matchRequest(request: RegaliaRequest): MatchRecommendation[] {
    const interpretedCategory = this.inferCategory(request);

    return this.providers
      .map((provider) => {
        const score = this.scoreProvider(provider, request, interpretedCategory);
        const estimatedOrder = Math.min(Math.max(request.budget, provider.priceFrom), provider.priceTo);

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
          reservation: this.calculateReservationBreakdown(estimatedOrder),
        };
      })
      .filter((recommendation) => recommendation.score >= 60)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
  }

  getAdminMetrics(): AdminMetric[] {
    const orders = this.getOrders();
    const commissions = orders.reduce((sum, order) => sum + order.commission, 0);
    const reserved = orders.reduce((sum, order) => sum + order.reservation, 0);

    return [
      { label: 'Pedidos activos', value: String(orders.length), hint: 'solicitudes con reserva registrada' },
      { label: 'Reservas captadas', value: `S/ ${this.roundMoney(reserved)}`, hint: 'seña procesada por REGALIA' },
      { label: 'Comisiones', value: `S/ ${this.roundMoney(commissions)}`, hint: 'ingreso estimado de plataforma' },
      { label: 'Proveedores', value: String(this.providers.length), hint: 'perfiles visibles en Trujillo' },
    ];
  }

  /**
   * Avanza un pedido dentro del flujo operativo de estados del MVP.
   */
  advanceOrderStatus(currentStatus: OrderStatus): OrderStatus {
    const currentIndex = this.orderStatuses.indexOf(currentStatus);
    const nextIndex = Math.min(currentIndex + 1, this.orderStatuses.length - 1);

    return this.orderStatuses[nextIndex] ?? currentStatus;
  }

  private inferCategory(request: RegaliaRequest): RegaliaCategory {
    const need = this.normalizeText(request.need);

    if (need.includes('flor') || need.includes('ramo')) return 'Arreglos florales';
    if (need.includes('torta') || need.includes('cupcake') || need.includes('dulce')) return 'Repostería personalizada';
    if (need.includes('caja') || need.includes('desayuno')) return 'Cajas sorpresa';
    if (need.includes('taza') || need.includes('polo') || need.includes('sublim')) return 'Sublimados';
    if (need.includes('madera') || need.includes('grabado')) return 'Carpintería personalizada';
    if (need.includes('decor') || need.includes('evento')) return 'Decoración de eventos';
    if (need.includes('foto') || need.includes('diseno')) return 'Servicios creativos';

    return request.occasion === 'Evento corporativo' ? 'Servicios creativos' : 'Cajas sorpresa';
  }

  private scoreProvider(provider: RegaliaProvider, request: RegaliaRequest, category: RegaliaCategory): number {
    const normalizedStyle = this.normalizeText(request.style);
    const categoryScore = provider.category === category ? 30 : 8;
    const occasionScore = provider.occasions.includes(request.occasion) ? 20 : 4;
    const budgetScore = request.budget >= provider.priceFrom ? 18 : 6;
    const styleScore = provider.styles.some((style) => normalizedStyle.includes(this.normalizeText(style))) ? 12 : 5;
    const urgencyScore = request.urgent && this.normalizeText(provider.deliveryTime).includes('mismo') ? 10 : 6;
    const reputationScore = Math.round(provider.reputation / 10);

    return Math.min(99, categoryScore + occasionScore + budgetScore + styleScore + urgencyScore + reputationScore);
  }

  private reasonFor(provider: RegaliaProvider, request: RegaliaRequest, category: RegaliaCategory): string {
    if (provider.category === category && provider.occasions.includes(request.occasion)) {
      return `Coincide con la categoría detectada, trabaja ${request.occasion.toLowerCase()} y encaja con el presupuesto referencial.`;
    }

    return 'Puede resolver la solicitud por estilo, reputación y disponibilidad, aunque requiere validar detalles finales.';
  }

  private normalizeText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private roundMoney(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
