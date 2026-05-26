import { Injectable } from '@angular/core';
import {
  BuildRequirements,
  PcComponent,
  RecommendedBuild,
  ValidationCheck,
} from '../../shared/models/pc-build.model';

@Injectable({ providedIn: 'root' })
export class BuildAdvisorService {
  generateBuild(requirements: BuildRequirements): RecommendedBuild {
    const components = this.pickComponents(requirements);
    const subtotal = components.reduce((sum, component) => sum + component.price, 0);
    const serviceFee = Math.round(subtotal * 0.02);

    return {
      title: this.getTitle(requirements),
      targetExperience: this.getTargetExperience(requirements),
      explanation: this.getExplanation(requirements),
      total: subtotal,
      components,
      checks: this.getCompatibilityChecks(requirements),
      quote: {
        storeName: 'Tienda demo PCBuilder',
        subtotal,
        serviceFee,
        total: subtotal + serviceFee,
        estimatedDelivery: '24 a 48 horas',
      },
    };
  }

  private pickComponents(requirements: BuildRequirements): PcComponent[] {
    const highBudget = requirements.budget >= 5200;
    const entryBudget = requirements.budget < 3300;
    const prefersNvidia = requirements.brandPreference.toLowerCase().includes('nvidia');

    const gpuName = highBudget
      ? 'RTX 4070 Super 12GB'
      : entryBudget
        ? 'RX 7600 8GB'
        : prefersNvidia
          ? 'RTX 4060 Ti 8GB'
          : 'RX 7700 XT 12GB';

    const gpuPrice = highBudget ? 2650 : entryBudget ? 1180 : prefersNvidia ? 1780 : 1950;
    const cpuName = highBudget ? 'Ryzen 7 7700' : entryBudget ? 'Ryzen 5 5600' : 'Ryzen 5 7600';
    const cpuPrice = highBudget ? 1230 : entryBudget ? 520 : 890;
    const ramType = entryBudget ? 'DDR4' : 'DDR5';

    return [
      {
        category: 'CPU',
        name: cpuName,
        brand: 'AMD',
        price: cpuPrice,
        stock: 8,
        attributes: [entryBudget ? 'AM4' : 'AM5', '6+ nucleos', 'alto rendimiento por sol'],
        reason: 'Prioriza rendimiento estable sin consumir demasiado presupuesto.',
      },
      {
        category: 'GPU',
        name: gpuName,
        brand: gpuName.startsWith('RTX') ? 'NVIDIA' : 'AMD Radeon',
        price: gpuPrice,
        stock: 5,
        attributes: [requirements.resolution, requirements.streaming ? 'encoder para streaming' : 'gaming fluido'],
        reason: 'Es el componente con mayor impacto para el uso indicado.',
      },
      {
        category: 'Motherboard',
        name: entryBudget ? 'B550M Pro VDH WiFi' : 'B650M Gaming Plus',
        brand: 'MSI',
        price: entryBudget ? 430 : 690,
        stock: 12,
        attributes: [entryBudget ? 'Socket AM4' : 'Socket AM5', ramType, 'M.2 NVMe'],
        reason: 'Mantiene compatibilidad con CPU, RAM y almacenamiento moderno.',
      },
      {
        category: 'RAM',
        name: entryBudget ? '16GB 3200MHz DDR4' : '32GB 6000MHz DDR5',
        brand: 'Kingston',
        price: entryBudget ? 210 : 480,
        stock: 16,
        attributes: [ramType, entryBudget ? '2x8GB' : '2x16GB', 'dual channel'],
        reason: requirements.streaming
          ? '32GB evita caidas al jugar, grabar y tener apps abiertas.'
          : 'Dual channel mejora la respuesta general del sistema.',
      },
      {
        category: 'Storage',
        name: 'SSD NVMe 1TB Gen4',
        brand: 'Crucial',
        price: 310,
        stock: 10,
        attributes: ['1TB', 'NVMe', 'PCIe 4.0'],
        reason: 'Carga rapida para sistema, juegos y programas principales.',
      },
      {
        category: 'PSU',
        name: highBudget ? '750W 80+ Gold' : '650W 80+ Bronze',
        brand: 'Corsair',
        price: highBudget ? 470 : 310,
        stock: 7,
        attributes: ['margen seguro', 'protecciones electricas', highBudget ? 'Gold' : 'Bronze'],
        reason: 'Deja margen para picos de consumo y futuras mejoras.',
      },
      {
        category: 'Case',
        name: requirements.rgb ? 'Airflow RGB Mesh' : 'Airflow Mesh Compact',
        brand: 'DeepCool',
        price: requirements.rgb ? 330 : 260,
        stock: 9,
        attributes: ['mesh frontal', 'soporte GPU larga', requirements.rgb ? 'ARGB' : 'minimalista'],
        reason: 'Buen flujo de aire para sostener temperaturas sanas.',
      },
      {
        category: 'Cooling',
        name: highBudget ? 'Torre dual 120mm' : 'Torre 120mm',
        brand: 'Cooler Master',
        price: highBudget ? 210 : 140,
        stock: 11,
        attributes: ['bajo ruido', 'compatible con socket', 'mejor que stock'],
        reason: 'Reduce temperatura y ruido bajo carga.',
      },
    ];
  }

  private getCompatibilityChecks(requirements: BuildRequirements): ValidationCheck[] {
    const entryBudget = requirements.budget < 3300;

    return [
      {
        label: 'CPU y motherboard',
        detail: entryBudget ? 'Socket AM4 validado con placa B550.' : 'Socket AM5 validado con placa B650.',
        status: 'ok',
      },
      {
        label: 'RAM compatible',
        detail: entryBudget ? 'Kit DDR4 compatible con la plataforma.' : 'Kit DDR5 compatible con la plataforma.',
        status: 'ok',
      },
      {
        label: 'Fuente de poder',
        detail: 'Potencia con margen recomendado para carga maxima y upgrades moderados.',
        status: 'ok',
      },
      {
        label: 'Cuello de botella',
        detail: requirements.budget < 2800
          ? 'Puede existir limitacion en juegos AAA pesados; se recomienda subir presupuesto si apunta a ultra.'
          : 'Balance CPU/GPU adecuado para el objetivo declarado.',
        status: requirements.budget < 2800 ? 'warning' : 'ok',
      },
    ];
  }

  private getTitle(requirements: BuildRequirements): string {
    const titles: Record<BuildRequirements['useCase'], string> = {
      gaming: 'Build gaming equilibrada',
      gaming_streaming: 'Build gaming + streaming',
      design: 'Build para creacion y diseno',
      office: 'Build productiva y eficiente',
      programming: 'Build para desarrollo',
    };

    return titles[requirements.useCase];
  }

  private getTargetExperience(requirements: BuildRequirements): string {
    return `${requirements.resolution} | Presupuesto S/ ${requirements.budget}`;
  }

  private getExplanation(requirements: BuildRequirements): string {
    if (requirements.useCase === 'gaming_streaming') {
      return 'Se prioriza GPU, RAM amplia y una fuente con margen para jugar y transmitir con estabilidad.';
    }

    if (requirements.useCase === 'design') {
      return 'Se busca equilibrio entre CPU, RAM y GPU para edicion, render ligero y multitarea.';
    }

    return 'La recomendacion reparte el presupuesto entre rendimiento, compatibilidad y margen de mejora.';
  }
}
