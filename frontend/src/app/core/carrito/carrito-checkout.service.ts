import { computed, Injectable, signal } from '@angular/core';
import { Producto } from '../../domains/catalogo/modelos/producto.model';
import { ItemCarrito } from './carrito.model';

const CLAVE_CARRITO_REGALIA = 'regalia.carrito.checkout';

@Injectable({ providedIn: 'root' })
export class CarritoCheckoutService {
  private readonly itemsCarrito = signal<ItemCarrito[]>(this.obtenerItemsGuardados());

  readonly items = computed(() => this.itemsCarrito());
  readonly cantidadItems = computed(() =>
    this.itemsCarrito().reduce((total, item) => total + item.cantidad, 0),
  );
  readonly total = computed(() =>
    this.itemsCarrito().reduce((total, item) => total + item.precioUnitario * item.cantidad, 0),
  );
  readonly estaVacio = computed(() => this.itemsCarrito().length === 0);

  agregarProducto(producto: Producto, cantidad = 1): void {
    const cantidadSegura = Math.max(1, Math.min(cantidad, producto.stock));
    const itemsActuales = this.itemsCarrito();
    const itemExistente = itemsActuales.find((item) => item.idProducto === producto.idProducto);

    const itemsActualizados = itemExistente
      ? itemsActuales.map((item) =>
          item.idProducto === producto.idProducto
            ? {
                ...item,
                cantidad: Math.min(item.cantidad + cantidadSegura, item.stockDisponible),
              }
            : item,
        )
      : [
          ...itemsActuales,
          {
            idProducto: producto.idProducto,
            idTienda: producto.idTienda,
            nombre: producto.nombre,
            nombreTienda: producto.nombreTienda,
            tipoProducto: producto.tipoProducto,
            precioUnitario: producto.precio,
            cantidad: cantidadSegura,
            stockDisponible: producto.stock,
            urlImagen: producto.imagenes[0]?.urlImagen ?? '/assets/brand/producto-fallback.svg',
            observacion: null,
          },
        ];

    this.actualizarCarrito(itemsActualizados);
  }

  actualizarCantidad(idProducto: number, cantidad: number): void {
    const itemsActualizados = this.itemsCarrito().map((item) =>
      item.idProducto === idProducto
        ? { ...item, cantidad: Math.max(1, Math.min(cantidad, item.stockDisponible)) }
        : item,
    );

    this.actualizarCarrito(itemsActualizados);
  }

  actualizarObservacion(idProducto: number, observacion: string): void {
    const textoNormalizado = observacion.trim() || null;
    const itemsActualizados = this.itemsCarrito().map((item) =>
      item.idProducto === idProducto ? { ...item, observacion: textoNormalizado } : item,
    );

    this.actualizarCarrito(itemsActualizados);
  }

  quitarProducto(idProducto: number): void {
    this.actualizarCarrito(this.itemsCarrito().filter((item) => item.idProducto !== idProducto));
  }

  limpiarCarrito(): void {
    this.actualizarCarrito([]);
  }

  private actualizarCarrito(items: ItemCarrito[]): void {
    this.itemsCarrito.set(items);
    // Contrato del backend: el carrito vive en frontend y se envia recien al confirmar checkout.
    localStorage.setItem(CLAVE_CARRITO_REGALIA, JSON.stringify(items));
  }

  private obtenerItemsGuardados(): ItemCarrito[] {
    const contenido = localStorage.getItem(CLAVE_CARRITO_REGALIA);
    if (!contenido) return [];

    try {
      const items = JSON.parse(contenido) as ItemCarrito[];
      return Array.isArray(items) ? items : [];
    } catch {
      localStorage.removeItem(CLAVE_CARRITO_REGALIA);
      return [];
    }
  }
}
