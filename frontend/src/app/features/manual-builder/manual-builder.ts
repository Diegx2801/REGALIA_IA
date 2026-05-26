import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogService } from '../../data-access/catalog/catalog.service';
import { CatalogProduct } from '../../shared/models/catalog-product.model';
import { ComponentCategory, ValidationStatus } from '../../shared/models/pc-build.model';

interface ManualValidation {
  label: string;
  detail: string;
  status: ValidationStatus;
}

type ManualSelection = Partial<Record<ComponentCategory, CatalogProduct>>;

@Component({
  selector: 'app-manual-builder',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './manual-builder.html',
  styleUrl: './manual-builder.css',
})
export class ManualBuilderComponent {
  private readonly catalogService = inject(CatalogService);

  readonly categories: ComponentCategory[] = ['CPU', 'Motherboard', 'RAM', 'GPU', 'Storage', 'PSU', 'Case', 'Cooling'];
  readonly activeCategory = signal<ComponentCategory>('CPU');
  readonly selections = signal<ManualSelection>({});
  readonly products = this.catalogService.getProducts();

  readonly activeProducts = computed(() =>
    this.products.filter((product) => product.category === this.activeCategory()),
  );

  readonly selectedProducts = computed(() =>
    this.categories
      .map((category) => this.selections()[category])
      .filter((product): product is CatalogProduct => Boolean(product)),
  );

  readonly total = computed(() =>
    this.selectedProducts().reduce((sum, product) => sum + product.price, 0),
  );

  readonly completedCount = computed(() => this.selectedProducts().length);

  readonly validations = computed<ManualValidation[]>(() => {
    const selection = this.selections();
    const checks: ManualValidation[] = [];

    checks.push(this.requiredCheck(selection));
    checks.push(this.socketCheck(selection));
    checks.push(this.ramCheck(selection));
    checks.push(this.psuCheck(selection));
    checks.push(this.caseGpuCheck(selection));

    return checks;
  });

  readonly hasWarnings = computed(() =>
    this.validations().some((validation) => validation.status === 'warning'),
  );

  selectCategory(category: ComponentCategory): void {
    this.activeCategory.set(category);
  }

  selectProduct(product: CatalogProduct): void {
    this.selections.update((current) => ({
      ...current,
      [product.category]: product,
    }));
  }

  removeProduct(category: ComponentCategory): void {
    this.selections.update((current) => {
      const next = { ...current };
      delete next[category];
      return next;
    });
  }

  isSelected(product: CatalogProduct): boolean {
    return this.selections()[product.category]?.id === product.id;
  }

  categoryStatus(category: ComponentCategory): string {
    return this.selections()[category] ? 'Listo' : 'Pendiente';
  }

  attribute(product: CatalogProduct, key: string): string {
    return product.attributes[key] ?? '-';
  }

  trackCategory(_: number, category: ComponentCategory): string {
    return category;
  }

  trackProduct(_: number, product: CatalogProduct): number {
    return product.id;
  }

  trackValidation(_: number, validation: ManualValidation): string {
    return validation.label;
  }

  private requiredCheck(selection: ManualSelection): ManualValidation {
    const missing = this.categories.filter((category) => !selection[category]);

    return {
      label: 'Componentes obligatorios',
      detail: missing.length === 0
        ? 'La build tiene todas las categorias principales seleccionadas.'
        : `Faltan: ${missing.join(', ')}.`,
      status: missing.length === 0 ? 'ok' : 'warning',
    };
  }

  private socketCheck(selection: ManualSelection): ManualValidation {
    const cpuSocket = selection.CPU?.attributes['socket'];
    const motherboardSocket = selection.Motherboard?.attributes['socket'];
    const pending = !cpuSocket || !motherboardSocket;

    return {
      label: 'CPU y motherboard',
      detail: pending
        ? 'Selecciona CPU y motherboard para validar socket.'
        : cpuSocket === motherboardSocket
          ? `Socket ${cpuSocket} compatible.`
          : `Incompatibilidad: CPU ${cpuSocket} y placa ${motherboardSocket}.`,
      status: pending || cpuSocket === motherboardSocket ? 'ok' : 'warning',
    };
  }

  private ramCheck(selection: ManualSelection): ManualValidation {
    const motherboardRam = selection.Motherboard?.attributes['ram'];
    const ramType = selection.RAM?.attributes['ram'];
    const pending = !motherboardRam || !ramType;

    return {
      label: 'RAM y motherboard',
      detail: pending
        ? 'Selecciona RAM y motherboard para validar generacion.'
        : motherboardRam === ramType
          ? `${ramType} compatible con la motherboard.`
          : `Incompatibilidad: motherboard ${motherboardRam} y memoria ${ramType}.`,
      status: pending || motherboardRam === ramType ? 'ok' : 'warning',
    };
  }

  private psuCheck(selection: ManualSelection): ManualValidation {
    const psuWatts = this.numberFromAttribute(selection.PSU, 'wattage');
    const estimatedConsumption =
      this.numberFromAttribute(selection.CPU, 'powerDraw') +
      this.numberFromAttribute(selection.GPU, 'powerDraw') +
      120;
    const pending = !selection.PSU || !selection.CPU || !selection.GPU;
    const recommendedWatts = Math.ceil(estimatedConsumption * 1.35);

    return {
      label: 'Fuente de poder',
      detail: pending
        ? 'Selecciona CPU, GPU y PSU para estimar consumo.'
        : psuWatts >= recommendedWatts
          ? `PSU de ${psuWatts}W suficiente para consumo recomendado de ${recommendedWatts}W.`
          : `PSU baja: ${psuWatts}W frente a recomendacion de ${recommendedWatts}W.`,
      status: pending || psuWatts >= recommendedWatts ? 'ok' : 'warning',
    };
  }

  private caseGpuCheck(selection: ManualSelection): ManualValidation {
    const gpuLength = this.numberFromAttribute(selection.GPU, 'length');
    const clearance = this.numberFromAttribute(selection.Case, 'gpuClearance');
    const pending = !selection.GPU || !selection.Case;

    return {
      label: 'GPU y case',
      detail: pending
        ? 'Selecciona GPU y case para validar espacio fisico.'
        : clearance >= gpuLength
          ? `La GPU de ${gpuLength}mm entra en el case con ${clearance}mm.`
          : `La GPU de ${gpuLength}mm supera el espacio del case (${clearance}mm).`,
      status: pending || clearance >= gpuLength ? 'ok' : 'warning',
    };
  }

  private numberFromAttribute(product: CatalogProduct | undefined, key: string): number {
    const rawValue = product?.attributes[key] ?? '0';
    const match = rawValue.match(/\d+/);
    return match ? Number(match[0]) : 0;
  }
}
