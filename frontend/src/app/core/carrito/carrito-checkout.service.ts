import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SesionAutenticacionService } from '../autenticacion/sesion-autenticacion.service';
import { Producto } from '../../domains/catalogo/modelos/producto.model';
import { ItemCarrito } from './carrito.model';

const CLAVE_CARRITO_LEGADA = 'regalia.carrito.checkout';
const PREFIJO_CARRITO_REGALIA = 'regalia.carrito.checkout';

@Injectable({ providedIn: 'root' })
export class CarritoCheckoutService {
  private readonly sesion = inject(SesionAutenticacionService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly idUsuarioActual = signal<number | null>(
    this.sesion.usuarioActual()?.idUsuario ?? null,
  );
  private readonly itemsCarrito = signal<ItemCarrito[]>(
    this.obtenerItemsGuardados(this.idUsuarioActual()),
  );

  readonly items = computed(() => this.itemsCarrito());
  readonly cantidadItems = computed(() =>
    this.itemsCarrito().reduce((total, item) => total + item.cantidad, 0),
  );
  readonly total = computed(() =>
    this.itemsCarrito().reduce((total, item) => total + item.precioUnitario * item.cantidad, 0),
  );
  readonly estaVacio = computed(() => this.itemsCarrito().length === 0);

  constructor() {
    this.sesion.cambiosIdentidad$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ idUsuarioAnterior, idUsuarioActual }) => {
        this.cambiarContextoCarrito(idUsuarioAnterior, idUsuarioActual);
      });
  }

  agregarProducto(producto: Producto, cantidad = 1): boolean {
    if (!producto.disponible || producto.stock <= 0) return false;

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
    return true;
  }

  actualizarCantidad(idProducto: number, cantidad: number): void {
    const cantidadNormalizada = Number.isFinite(cantidad) ? Math.trunc(cantidad) : 1;
    const itemsActualizados = this.itemsCarrito().map((item) =>
      item.idProducto === idProducto
        ? {
            ...item,
            cantidad: Math.max(1, Math.min(cantidadNormalizada, item.stockDisponible)),
          }
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
    localStorage.setItem(this.obtenerClaveCarrito(this.idUsuarioActual()), JSON.stringify(items));
  }

  private obtenerItemsGuardados(idUsuario: number | null): ItemCarrito[] {
    const clave = this.obtenerClaveCarrito(idUsuario);
    this.migrarClaveLegada(clave);
    return this.leerItems(clave);
  }

  private leerItems(clave: string): ItemCarrito[] {
    const contenido = localStorage.getItem(clave);
    if (!contenido) return [];

    try {
      const items = JSON.parse(contenido) as ItemCarrito[];
      if (!Array.isArray(items)) return [];

      const itemsValidos = items.filter(
        (item) =>
          Number.isInteger(item.idProducto) &&
          Number.isInteger(item.idTienda) &&
          Number.isFinite(item.stockDisponible) &&
          item.stockDisponible > 0,
      );
      return itemsValidos.map((item) => ({
        ...item,
        cantidad: Math.max(1, Math.min(Math.trunc(item.cantidad), item.stockDisponible)),
      }));
    } catch {
      localStorage.removeItem(clave);
      return [];
    }
  }

  private cambiarContextoCarrito(
    idUsuarioAnterior: number | null,
    idUsuarioActual: number | null,
  ): void {
    const itemsSiguienteContexto =
      idUsuarioAnterior === null && idUsuarioActual !== null
        ? this.migrarCarritoInvitado(idUsuarioActual)
        : this.obtenerItemsGuardados(idUsuarioActual);

    this.idUsuarioActual.set(idUsuarioActual);
    this.itemsCarrito.set(itemsSiguienteContexto);
  }

  private migrarCarritoInvitado(idUsuario: number): ItemCarrito[] {
    const claveInvitado = this.obtenerClaveCarrito(null);
    const claveUsuario = this.obtenerClaveCarrito(idUsuario);
    const itemsInvitado = this.leerItems(claveInvitado);
    const itemsUsuario = this.leerItems(claveUsuario);
    const itemsCombinados = this.combinarItems(itemsUsuario, itemsInvitado);

    localStorage.setItem(claveUsuario, JSON.stringify(itemsCombinados));
    localStorage.removeItem(claveInvitado);
    return itemsCombinados;
  }

  private combinarItems(base: ItemCarrito[], adicionales: ItemCarrito[]): ItemCarrito[] {
    const items = new Map(base.map((item) => [item.idProducto, item]));

    for (const adicional of adicionales) {
      const existente = items.get(adicional.idProducto);
      items.set(
        adicional.idProducto,
        existente
          ? {
              ...existente,
              cantidad: Math.min(
                existente.cantidad + adicional.cantidad,
                existente.stockDisponible,
              ),
              observacion: existente.observacion ?? adicional.observacion,
            }
          : adicional,
      );
    }

    return [...items.values()];
  }

  private migrarClaveLegada(claveDestino: string): void {
    const contenidoLegado = localStorage.getItem(CLAVE_CARRITO_LEGADA);
    if (!contenidoLegado) return;

    if (localStorage.getItem(claveDestino) === null) {
      localStorage.setItem(claveDestino, contenidoLegado);
    }
    localStorage.removeItem(CLAVE_CARRITO_LEGADA);
  }

  private obtenerClaveCarrito(idUsuario: number | null): string {
    return idUsuario === null
      ? `${PREFIJO_CARRITO_REGALIA}.invitado`
      : `${PREFIJO_CARRITO_REGALIA}.usuario.${idUsuario}`;
  }
}
