import { computed, signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { VendedorPanelStore } from '../../estado/vendedor-panel.store';
import { ProductoVendedor, TiendaVendedor } from '../../modelos/vendedor.model';
import { FiltroInventarioTienda, PaginaVendedorTienda } from './pagina-vendedor-tienda';

describe('PaginaVendedorTienda', () => {
  let productos: WritableSignal<ProductoVendedor[]>;
  let tiendaSeleccionada: WritableSignal<TiendaVendedor | null>;
  let cargarCentroTienda: ReturnType<typeof vi.fn>;
  let cancelarCargaCentroTienda: ReturnType<typeof vi.fn>;
  let harness: RouterTestingHarness;
  let pagina: PaginaVendedorTienda;

  beforeEach(async () => {
    productos = signal(crearProductos());
    tiendaSeleccionada = signal(crearTienda());
    cargarCentroTienda = vi.fn();
    cancelarCargaCentroTienda = vi.fn();

    const cargandoTienda = signal<number | null>(null);
    const cargandoProductos = signal(false);
    const mensajeError = signal<string | null>(null);
    const storeMock = {
      tiendaSeleccionada,
      productos,
      cargandoTienda,
      cargandoProductos,
      mensajeError,
      inventarioListo: computed(() => true),
      limpiarMensajes: vi.fn(),
      cargarCentroTienda,
      cancelarCargaCentroTienda,
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: VendedorPanelStore, useValue: storeMock },
        provideRouter([
          {
            path: 'vendedor/tiendas/:idTienda',
            component: PaginaVendedorTienda,
          },
        ]),
      ],
    });

    harness = await RouterTestingHarness.create();
    pagina = await harness.navigateByUrl('/vendedor/tiendas/10', PaginaVendedorTienda);
    await harness.fixture.whenStable();
  });

  it('carga el centro solicitado y presenta la identidad real de la tienda', () => {
    expect(cargarCentroTienda).toHaveBeenCalledOnce();
    expect(cargarCentroTienda).toHaveBeenCalledWith(10);
    expect(harness.routeNativeElement?.textContent).toContain('Detalles Aurora');
    expect(harness.routeNativeElement?.textContent).toContain('Activa en REGALIA');
  });

  it('calcula indicadores sin confundir estado, visibilidad y stock', async () => {
    expect(pagina.productosActivos()).toHaveLength(2);
    expect(pagina.productosInactivos()).toHaveLength(2);
    expect(pagina.productosSinStock()).toHaveLength(1);
    expect(pagina.productosPublicados()).toBe(1);
    expect(pagina.unidadesDisponibles()).toBe(5);

    productos.set([crearProducto(9, { stock: 3, visibleEnTienda: true })]);
    await harness.fixture.whenStable();

    expect(pagina.productosActivos()).toHaveLength(1);
    expect(pagina.productosInactivos()).toHaveLength(0);
    expect(pagina.unidadesDisponibles()).toBe(3);
  });

  it.each([
    ['TODOS', [1, 2, 3, 4]],
    ['ACTIVOS', [1, 2]],
    ['INACTIVOS', [3, 4]],
    ['SIN_STOCK', [2]],
  ] as const)('filtra el inventario por %s', (filtro, idsEsperados) => {
    pagina.establecerFiltroInventario(filtro as FiltroInventarioTienda);

    expect(pagina.productosFiltrados().map((producto) => producto.idProducto)).toEqual(
      idsEsperados,
    );
  });

  it('busca por nombre o tipo sin depender de mayusculas ni tildes', () => {
    pagina.busquedaInventario.set('  CANASTA ');
    pagina.establecerFiltroInventario('INACTIVOS');

    expect(pagina.productosFiltrados().map((producto) => producto.idProducto)).toEqual([3]);

    pagina.establecerFiltroInventario('TODOS');
    pagina.busquedaInventario.set('decoración');

    expect(pagina.productosFiltrados().map((producto) => producto.idProducto)).toEqual([1, 2]);
  });

  it('comunica filtros y resultados vacios de forma accesible', async () => {
    pagina.establecerFiltroInventario('INACTIVOS');
    pagina.busquedaInventario.set('producto inexistente');
    await harness.fixture.whenStable();

    const elemento = harness.routeNativeElement;
    const filtroActivo = Array.from(
      elemento?.querySelectorAll<HTMLButtonElement>('[aria-pressed]') ?? [],
    ).find((boton) => boton.textContent?.includes('Inactivos'));
    const buscador = elemento?.querySelector<HTMLInputElement>('#buscar-producto-inventario');

    expect(filtroActivo?.getAttribute('aria-pressed')).toBe('true');
    expect(buscador?.labels?.item(0)?.textContent).toContain('Buscar en el inventario');
    expect(elemento?.textContent).toContain('No encontramos productos con estos filtros.');

    pagina.limpiarFiltrosInventario();
    await harness.fixture.whenStable();

    expect(pagina.productosFiltrados()).toHaveLength(4);
  });

  function crearTienda(): TiendaVendedor {
    return {
      idTienda: 10,
      nombre: 'Detalles Aurora',
      descripcion: 'Regalos personalizados para momentos especiales.',
      direccionReferencia: 'Miraflores, Lima',
      estadoRevision: 'APROBADA',
      formalizada: true,
      idDocumentoFiscal: 1,
      rubros: [{ idRubro: 1, nombre: 'Regalos' }],
      estado: true,
    };
  }

  function crearProductos(): ProductoVendedor[] {
    return [
      crearProducto(1, { nombre: 'Box Premium', stock: 5, visibleEnTienda: true }),
      crearProducto(2, { nombre: 'Ramo Oculto', stock: 0, visibleEnTienda: false }),
      crearProducto(3, {
        nombre: 'Canasta Antigua',
        tipoProducto: 'Canastas',
        stock: 8,
        estado: false,
        visibleEnTienda: true,
      }),
      crearProducto(4, {
        nombre: 'Taza Retirada',
        tipoProducto: 'Cerámica',
        stock: -1,
        estado: false,
        visibleEnTienda: false,
      }),
    ];
  }

  function crearProducto(
    idProducto: number,
    cambios: Partial<ProductoVendedor> = {},
  ): ProductoVendedor {
    return {
      idProducto,
      idTienda: 10,
      nombreTienda: 'Detalles Aurora',
      idTipoProducto: 1,
      tipoProducto: 'Decoración',
      nombre: `Producto ${idProducto}`,
      descripcion: 'Producto personalizado',
      precio: 59.9,
      stock: 1,
      visibleEnTienda: true,
      estado: true,
      imagenes: [],
      urlImagen: '/assets/brand/producto-fallback.svg',
      ...cambios,
    };
  }
});
