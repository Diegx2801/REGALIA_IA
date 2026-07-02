import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RegaliaService } from '../../core/services/data-access/regalia/regalia.service';
import { RegaliaProvider } from '../../shared/models/regalia.model';

// Producto publicado localmente por el proveedor antes de conectar persistencia con backend.
interface ProviderCatalogItem {
  id: number;
  name: string;
  price: number;
  status: 'Activo' | 'Pausado';
  category: string;
  imageName: string;
  imagePreview: string;
}

@Component({
  selector: 'app-provider-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './provider-profile.html',
  styleUrl: './provider-profile.css',
})
export class ProviderProfileComponent {
  private readonly regaliaService = inject(RegaliaService);

  readonly provider = signal<RegaliaProvider>(this.regaliaService.getProviders()[0]);
  readonly saved = signal(false);
  readonly productSaved = signal(false);
  // Identifica si el formulario está creando un producto nuevo o editando uno existente.
  readonly editingProductId = signal<number | null>(null);
  // URL local en memoria para previsualizar la imagen antes de persistirla.
  readonly imagePreview = signal('');
  private nextProductId = 4;

  readonly profileForm = new FormGroup({
    businessName: new FormControl(this.provider().businessName, { nonNullable: true }),
    ownerName: new FormControl(this.provider().ownerName, { nonNullable: true }),
    district: new FormControl(this.provider().district, { nonNullable: true }),
    whatsapp: new FormControl(this.provider().whatsapp, { nonNullable: true }),
    availability: new FormControl(this.provider().availability, { nonNullable: true }),
    deliveryTime: new FormControl(this.provider().deliveryTime, { nonNullable: true }),
    description: new FormControl(this.provider().description, { nonNullable: true }),
  });

  readonly catalogItems = signal<ProviderCatalogItem[]>([
    { id: 1, name: 'Box premium personalizado', price: 129, status: 'Activo', category: 'Cajas sorpresa', imageName: 'box-premium.jpg', imagePreview: '/images/regalia-hero-gift.png' },
    { id: 2, name: 'Detalle express', price: 75, status: 'Activo', category: 'Regalos personalizados', imageName: 'detalle-express.jpg', imagePreview: '/images/regalia-hero-gift.png' },
    { id: 3, name: 'Pack corporativo', price: 180, status: 'Pausado', category: 'Evento corporativo', imageName: 'pack-corporativo.jpg', imagePreview: '/images/regalia-hero-gift.png' },
  ]);

  readonly productForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3)] }),
    category: new FormControl('Cajas sorpresa', { nonNullable: true }),
    price: new FormControl(80, { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
    status: new FormControl<'Activo' | 'Pausado'>('Activo', { nonNullable: true }),
    imageName: new FormControl('', { nonNullable: true }),
    description: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(10)] }),
  });

  saveProfile(): void {
    this.saved.set(false);
    this.provider.update((provider) => ({ ...provider, ...this.profileForm.getRawValue() }));
    this.saved.set(true);
  }

  publishProduct(): void {
    // Valida el formulario y luego crea o actualiza el producto en el catálogo simulado local.
    this.productSaved.set(false);
    const product = this.productForm.getRawValue();

    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    const productPayload: ProviderCatalogItem = {
      id: this.editingProductId() ?? this.nextProductId++,
      name: product.name,
      price: product.price,
      status: product.status,
      category: product.category,
      imageName: product.imageName || 'imagen-pendiente.jpg',
      imagePreview: this.imagePreview() || '/images/regalia-hero-gift.png',
    };

    this.catalogItems.update((items) =>
      this.editingProductId()
        ? items.map((item) => (item.id === productPayload.id ? productPayload : item))
        : [productPayload, ...items],
    );
    this.resetProductForm();
    this.productSaved.set(true);
  }

  editProduct(item: ProviderCatalogItem): void {
    // Carga un producto publicado al formulario para editarlo sin salir de la pantalla.
    this.editingProductId.set(item.id);
    this.imagePreview.set(item.imagePreview);
    this.productForm.setValue({
      name: item.name,
      category: item.category,
      price: item.price,
      status: item.status,
      imageName: item.imageName,
      description: 'Producto publicado en catálogo del proveedor.',
    });
  }

  deleteProduct(item: ProviderCatalogItem): void {
    // Elimina solo del estado local; el backend se conectará después.
    this.catalogItems.update((items) => items.filter((currentItem) => currentItem.id !== item.id));

    if (this.editingProductId() === item.id) {
      this.resetProductForm();
    }
  }

  onImageSelected(event: Event): void {
    // Convierte la imagen seleccionada en vista previa local para mejorar la revisión del proveedor.
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    this.productForm.controls.imageName.setValue(file.name);
    const reader = new FileReader();
    reader.onload = () => this.imagePreview.set(String(reader.result));
    reader.readAsDataURL(file);
  }

  resetProductForm(): void {
    this.productForm.reset({
      name: '',
      category: 'Cajas sorpresa',
      price: 80,
      status: 'Activo',
      imageName: '',
      description: '',
    });
    this.editingProductId.set(null);
    this.imagePreview.set('');
  }

  hasProductError(controlName: keyof typeof this.productForm.controls): boolean {
    const control = this.productForm.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  trackText(_: number, value: string): string {
    return value;
  }

  trackCatalog(_: number, item: ProviderCatalogItem): string {
    return String(item.id);
  }
}
