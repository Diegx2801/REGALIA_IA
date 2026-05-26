import { Injectable } from '@angular/core';
import { CatalogFilters, CatalogProduct } from '../../shared/models/catalog-product.model';
import { ComponentCategory } from '../../shared/models/pc-build.model';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly products: CatalogProduct[] = [
    {
      id: 1,
      category: 'CPU',
      name: 'Ryzen 5 7600',
      brand: 'AMD',
      price: 890,
      stock: 8,
      imageTone: '#00ff66',
      attributes: { socket: 'AM5', cores: '6 nucleos / 12 hilos', tdp: '65W', powerDraw: '90W' },
      compatibilityTags: ['AM5', 'DDR5', 'Gaming'],
      shortDescription: 'Procesador eficiente para gaming competitivo, streaming ligero y uso diario exigente.',
      storeName: 'Tienda demo PCBuilder',
    },
    {
      id: 2,
      category: 'CPU',
      name: 'Ryzen 7 7700',
      brand: 'AMD',
      price: 1230,
      stock: 5,
      imageTone: '#00ff66',
      attributes: { socket: 'AM5', cores: '8 nucleos / 16 hilos', tdp: '65W', powerDraw: '105W' },
      compatibilityTags: ['AM5', 'DDR5', 'Streaming'],
      shortDescription: 'Opcion fuerte para multitarea, edicion y gaming con mayor margen a futuro.',
      storeName: 'Tienda demo PCBuilder',
    },
    {
      id: 3,
      category: 'GPU',
      name: 'RTX 4060 Ti 8GB',
      brand: 'NVIDIA',
      price: 1780,
      stock: 6,
      imageTone: '#0066ff',
      attributes: { vram: '8GB GDDR6', pcie: 'PCIe 4.0', length: '244mm', powerDraw: '165W' },
      compatibilityTags: ['1080p ultra', 'DLSS', 'Streaming'],
      shortDescription: 'GPU balanceada para 1080p alto y encoder dedicado para creadores.',
      storeName: 'Tienda demo PCBuilder',
    },
    {
      id: 4,
      category: 'GPU',
      name: 'RX 7700 XT 12GB',
      brand: 'AMD Radeon',
      price: 1950,
      stock: 4,
      imageTone: '#0066ff',
      attributes: { vram: '12GB GDDR6', pcie: 'PCIe 4.0', length: '267mm', powerDraw: '245W' },
      compatibilityTags: ['1440p', '12GB VRAM', 'Alto FPS'],
      shortDescription: 'Buen salto para jugar en 1440p con memoria amplia para texturas pesadas.',
      storeName: 'Tienda demo PCBuilder',
    },
    {
      id: 5,
      category: 'Motherboard',
      name: 'B650M Gaming Plus',
      brand: 'MSI',
      price: 690,
      stock: 9,
      imageTone: '#6ee7f9',
      attributes: { socket: 'AM5', ram: 'DDR5', storage: '2x M.2 NVMe', formFactor: 'mATX' },
      compatibilityTags: ['AM5', 'DDR5', 'M.2'],
      shortDescription: 'Placa base compacta con conectividad moderna para builds de gama media.',
      storeName: 'Tienda demo PCBuilder',
    },
    {
      id: 6,
      category: 'Motherboard',
      name: 'B550M Pro VDH WiFi',
      brand: 'MSI',
      price: 430,
      stock: 11,
      imageTone: '#6ee7f9',
      attributes: { socket: 'AM4', ram: 'DDR4', network: 'WiFi integrado', formFactor: 'mATX' },
      compatibilityTags: ['AM4', 'DDR4', 'WiFi'],
      shortDescription: 'Base economica y confiable para builds con Ryzen serie 5000.',
      storeName: 'Tienda demo PCBuilder',
    },
    {
      id: 7,
      category: 'RAM',
      name: 'Kingston Fury 32GB DDR5',
      brand: 'Kingston',
      price: 480,
      stock: 14,
      imageTone: '#00ff66',
      attributes: { capacity: '32GB', speed: '6000MHz', layout: '2x16GB', ram: 'DDR5' },
      compatibilityTags: ['DDR5', 'Dual channel', 'AM5'],
      shortDescription: 'Kit recomendado para gaming, streaming y multitarea sin cuellos por memoria.',
      storeName: 'Tienda demo PCBuilder',
    },
    {
      id: 8,
      category: 'RAM',
      name: 'Corsair Vengeance 16GB DDR4',
      brand: 'Corsair',
      price: 210,
      stock: 18,
      imageTone: '#00ff66',
      attributes: { capacity: '16GB', speed: '3200MHz', layout: '2x8GB', ram: 'DDR4' },
      compatibilityTags: ['DDR4', 'Dual channel', 'AM4'],
      shortDescription: 'Memoria de entrada solida para builds economicas o productivas.',
      storeName: 'Tienda demo PCBuilder',
    },
    {
      id: 9,
      category: 'Storage',
      name: 'Crucial P3 Plus 1TB',
      brand: 'Crucial',
      price: 310,
      stock: 13,
      imageTone: '#f8fafc',
      attributes: { capacity: '1TB', interface: 'NVMe PCIe 4.0', format: 'M.2 2280' },
      compatibilityTags: ['NVMe', '1TB', 'PCIe 4.0'],
      shortDescription: 'SSD rapido para sistema, juegos y programas principales.',
      storeName: 'Tienda demo PCBuilder',
    },
    {
      id: 10,
      category: 'PSU',
      name: 'Corsair CX650 80+ Bronze',
      brand: 'Corsair',
      price: 310,
      stock: 7,
      imageTone: '#fbbf24',
      attributes: { power: '650W', certification: '80+ Bronze', modular: 'No modular', wattage: '650W' },
      compatibilityTags: ['650W', 'Bronze', 'ATX'],
      shortDescription: 'Fuente con margen seguro para PCs de consumo medio.',
      storeName: 'Tienda demo PCBuilder',
    },
    {
      id: 11,
      category: 'Case',
      name: 'DeepCool Airflow Mesh',
      brand: 'DeepCool',
      price: 260,
      stock: 9,
      imageTone: '#9ca3af',
      attributes: { format: 'mATX / ATX', gpuClearance: '320mm', fans: '3 ventiladores' },
      compatibilityTags: ['Airflow', 'ATX', 'GPU larga'],
      shortDescription: 'Case con frente mesh para mantener buena temperatura sin subir presupuesto.',
      storeName: 'Tienda demo PCBuilder',
    },
    {
      id: 12,
      category: 'Cooling',
      name: 'Cooler Master Hyper 212',
      brand: 'Cooler Master',
      price: 140,
      stock: 10,
      imageTone: '#6ee7f9',
      attributes: { type: 'Torre 120mm', sockets: 'AM4 / AM5 / LGA1700', noise: 'Bajo ruido' },
      compatibilityTags: ['AM5', 'AM4', '120mm'],
      shortDescription: 'Disipador simple y efectivo para mejorar temperaturas frente al cooler stock.',
      storeName: 'Tienda demo PCBuilder',
    },
  ];

  getProducts(): CatalogProduct[] {
    return this.products;
  }

  getCategories(): Array<ComponentCategory | 'All'> {
    return ['All', 'CPU', 'GPU', 'Motherboard', 'RAM', 'Storage', 'PSU', 'Case', 'Cooling'];
  }

  getBrands(): string[] {
    return Array.from(new Set(this.products.map((product) => product.brand))).sort();
  }

  filterProducts(filters: CatalogFilters): CatalogProduct[] {
    const search = filters.search.trim().toLowerCase();

    return this.products.filter((product) => {
      const matchesSearch =
        search.length === 0 ||
        product.name.toLowerCase().includes(search) ||
        product.brand.toLowerCase().includes(search) ||
        product.compatibilityTags.some((tag) => tag.toLowerCase().includes(search));

      const matchesCategory = filters.category === 'All' || product.category === filters.category;
      const matchesBrand = filters.brand === 'All' || product.brand === filters.brand;
      const matchesStock = !filters.stockOnly || product.stock > 0;
      const matchesPrice = product.price <= filters.maxPrice;

      return matchesSearch && matchesCategory && matchesBrand && matchesStock && matchesPrice;
    });
  }
}
