import { Injectable } from '@angular/core';
import { MarketplaceQuote } from '../../shared/models/marketplace-quote.model';
import { PcComponent } from '../../shared/models/pc-build.model';

@Injectable({ providedIn: 'root' })
export class MarketplaceQuotesService {
  // Ofertas mock: cada tienda vende una build completa, sin mezclar piezas entre tiendas.
  private readonly quotes: MarketplaceQuote[] = [
    {
      id: 1,
      highlight: 'Mejor balance',
      store: {
        id: 101,
        name: 'TechZone Peru',
        district: 'Miraflores',
        rating: 4.8,
        reviews: 324,
        warranty: '24 meses tienda + marca',
        deliveryTime: '24h',
        responseTime: '12 min',
      },
      buildName: 'Ryzen AM5 Gaming Stream',
      target: '1080p competitivo + streaming',
      total: 4470,
      stockStatus: 'Completo',
      score: 96,
      scoreBreakdown: { price: 91, stock: 100, reputation: 96, warranty: 94, delivery: 98 },
      explanation: 'Equilibra precio, stock completo, buena garantia y entrega rapida sin bajar la plataforma AM5.',
      components: [
        this.component('CPU', 'Ryzen 5 7600', 'AMD', 890, ['AM5', '6 nucleos', '65W']),
        this.component('GPU', 'RTX 4060 Ti 8GB', 'NVIDIA', 1780, ['DLSS', 'PCIe 4.0', '244mm']),
        this.component('Motherboard', 'B650M Gaming Plus', 'MSI', 690, ['AM5', 'DDR5', 'M.2']),
        this.component('RAM', '32GB DDR5 6000MHz', 'Kingston', 480, ['DDR5', '2x16GB', 'Dual channel']),
        this.component('Storage', 'SSD NVMe 1TB Gen4', 'Crucial', 310, ['1TB', 'PCIe 4.0', 'M.2']),
        this.component('PSU', '650W 80+ Bronze', 'Corsair', 310, ['650W', 'Bronze', 'ATX']),
        this.component('Case', 'Airflow Mesh Compact', 'DeepCool', 260, ['Mesh', 'GPU 320mm', 'ATX']),
        this.component('Cooling', 'Torre 120mm', 'Cooler Master', 140, ['AM5', 'Bajo ruido', '120mm']),
      ],
    },
    {
      id: 2,
      highlight: 'Mas economica',
      store: {
        id: 102,
        name: 'CompuMarket Lima',
        district: 'Wilson',
        rating: 4.5,
        reviews: 512,
        warranty: '12 meses tienda',
        deliveryTime: '48h',
        responseTime: '22 min',
      },
      buildName: 'AM4 Value Gaming',
      target: '1080p alto',
      total: 3990,
      stockStatus: 'Completo',
      score: 89,
      scoreBreakdown: { price: 100, stock: 98, reputation: 88, warranty: 82, delivery: 84 },
      explanation: 'Reduce costo usando AM4 y DDR4, manteniendo una experiencia solida para 1080p.',
      components: [
        this.component('CPU', 'Ryzen 5 5600', 'AMD', 520, ['AM4', '6 nucleos', '65W']),
        this.component('GPU', 'RX 7600 8GB', 'AMD Radeon', 1180, ['1080p', 'PCIe 4.0', '8GB']),
        this.component('Motherboard', 'B550M Pro VDH WiFi', 'MSI', 430, ['AM4', 'DDR4', 'WiFi']),
        this.component('RAM', '16GB DDR4 3200MHz', 'Corsair', 210, ['DDR4', '2x8GB', 'Dual channel']),
        this.component('Storage', 'SSD NVMe 1TB Gen3', 'Kingston', 280, ['1TB', 'NVMe', 'M.2']),
        this.component('PSU', '650W 80+ Bronze', 'Corsair', 310, ['650W', 'Bronze', 'ATX']),
        this.component('Case', 'Airflow Mesh Compact', 'DeepCool', 260, ['Mesh', 'GPU 320mm', 'ATX']),
        this.component('Cooling', 'Cooler stock optimizado', 'AMD', 0, ['Incluido', 'AM4', 'Basico']),
      ],
    },
    {
      id: 3,
      highlight: 'Mejor garantia',
      store: {
        id: 103,
        name: 'Elite Hardware Store',
        district: 'San Isidro',
        rating: 4.9,
        reviews: 188,
        warranty: '36 meses + soporte tecnico',
        deliveryTime: '24h',
        responseTime: '8 min',
      },
      buildName: 'Premium Warranty Build',
      target: '1080p ultra + upgrade ready',
      total: 4590,
      stockStatus: 'Completo',
      score: 94,
      scoreBreakdown: { price: 86, stock: 100, reputation: 99, warranty: 100, delivery: 96 },
      explanation: 'Cuesta un poco mas, pero ofrece mejor garantia, reputacion y soporte postventa.',
      components: [
        this.component('CPU', 'Ryzen 5 7600', 'AMD', 910, ['AM5', '6 nucleos', '65W']),
        this.component('GPU', 'RTX 4060 Ti 8GB OC', 'ASUS', 1860, ['DLSS', 'OC', '8GB']),
        this.component('Motherboard', 'B650M Gaming WiFi', 'ASUS', 720, ['AM5', 'DDR5', 'WiFi']),
        this.component('RAM', '32GB DDR5 RGB', 'Corsair', 520, ['DDR5', 'RGB', '2x16GB']),
        this.component('Storage', 'SSD NVMe 1TB Gen4', 'Samsung', 360, ['1TB', 'PCIe 4.0', 'M.2']),
        this.component('PSU', '750W 80+ Gold', 'Seasonic', 470, ['750W', 'Gold', 'ATX']),
        this.component('Case', 'Airflow RGB Mesh', 'DeepCool', 330, ['ARGB', 'Mesh', 'GPU 340mm']),
        this.component('Cooling', 'Torre dual 120mm', 'DeepCool', 210, ['AM5', 'Dual fan', 'Silencioso']),
      ],
    },
    {
      id: 4,
      highlight: 'Entrega rapida',
      store: {
        id: 104,
        name: 'FastPC Express',
        district: 'Surco',
        rating: 4.6,
        reviews: 241,
        warranty: '18 meses tienda',
        deliveryTime: 'Mismo dia',
        responseTime: '5 min',
      },
      buildName: 'Fast Delivery Gaming',
      target: '1080p competitivo',
      total: 4320,
      stockStatus: 'Reservable',
      score: 91,
      scoreBreakdown: { price: 93, stock: 88, reputation: 90, warranty: 86, delivery: 100 },
      explanation: 'La mejor opcion cuando el cliente prioriza recibir y ensamblar la PC lo antes posible.',
      components: [
        this.component('CPU', 'Ryzen 5 7600', 'AMD', 900, ['AM5', '6 nucleos', '65W']),
        this.component('GPU', 'RTX 4060 8GB', 'NVIDIA', 1520, ['DLSS', '8GB', 'Bajo consumo']),
        this.component('Motherboard', 'A620M Pro', 'Gigabyte', 470, ['AM5', 'DDR5', 'M.2']),
        this.component('RAM', '32GB DDR5 5600MHz', 'Kingston', 450, ['DDR5', '2x16GB', 'Dual channel']),
        this.component('Storage', 'SSD NVMe 1TB', 'Crucial', 300, ['1TB', 'NVMe', 'M.2']),
        this.component('PSU', '650W 80+ Bronze', 'EVGA', 300, ['650W', 'Bronze', 'ATX']),
        this.component('Case', 'Compact Mesh', 'Antryx', 240, ['Mesh', 'mATX', 'GPU 300mm']),
        this.component('Cooling', 'Torre 120mm', 'Cooler Master', 140, ['AM5', '120mm', 'Bajo ruido']),
      ],
    },
  ];

  getQuotes(): MarketplaceQuote[] {
    // El ranking inicial se ordena por score total del marketplace.
    return [...this.quotes].sort((a, b) => b.score - a.score);
  }

  private component(
    category: PcComponent['category'],
    name: string,
    brand: string,
    price: number,
    attributes: string[],
  ): PcComponent {
    return {
      category,
      name,
      brand,
      price,
      stock: 1,
      attributes,
      reason: 'Seleccionado por compatibilidad, disponibilidad y ajuste al presupuesto.',
    };
  }
}
