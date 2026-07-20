import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
import { CarritoCheckoutService } from '../../../../core/carrito/carrito-checkout.service';
import { TipoProductoApiService } from '../../../datos-maestros/acceso-datos/tipo-producto-api.service';
import { TiendaPublicaApiService } from '../../../tiendas/acceso-datos/tienda-publica-api.service';
import { ProductoApiService } from '../../acceso-datos/producto-api.service';
import { Producto } from '../../modelos/producto.model';
import { PaginaCatalogo } from './pagina-catalogo';

describe('PaginaCatalogo', () => {
  let harness: RouterTestingHarness;
  let productoApi: { obtenerProductos: ReturnType<typeof vi.fn> };
  let carrito: { agregarProducto: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    productoApi = {
      obtenerProductos: vi.fn(() =>
        of({
          contenido: [PRODUCTO],
          paginaActual: 0,
          tamanioPagina: 12,
          totalElementos: 1,
          totalPaginas: 1,
          ultimaPagina: true,
        }),
      ),
    };
    carrito = { agregarProducto: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        { provide: ProductoApiService, useValue: productoApi },
        {
          provide: TipoProductoApiService,
          useValue: {
            obtenerTiposProducto: vi.fn(() =>
              of([{ idTipoProducto: 3, nombre: 'PACK O BOX', estado: true }]),
            ),
          },
        },
        {
          provide: TiendaPublicaApiService,
          useValue: { obtenerTiendasPublicas: vi.fn(() => of([])) },
        },
        { provide: CarritoCheckoutService, useValue: carrito },
        provideRouter([{ path: 'catalogo', component: PaginaCatalogo }]),
      ],
    });

    harness = await RouterTestingHarness.create();
  });

  it('restaura los filtros de la URL y consulta el catálogo con su contrato real', async () => {
    const pagina = await harness.navigateByUrl(
      '/catalogo?busqueda=box&tipo=PACK%20O%20BOX&precioMaximo=150&disponibles=false&orden=priceAsc',
      PaginaCatalogo,
    );
    await harness.fixture.whenStable();

    expect(productoApi.obtenerProductos).toHaveBeenCalledWith({
      page: 0,
      size: 12,
      search: 'box',
      idTipoProducto: 3,
      precioMaximo: 150,
      soloDisponibles: false,
      orden: 'priceAsc',
    });
    expect(pagina.productos()).toEqual([PRODUCTO]);
  });

  it('confirma al usuario cuando agrega un producto disponible', async () => {
    const pagina = await harness.navigateByUrl('/catalogo', PaginaCatalogo);
    await harness.fixture.whenStable();

    pagina.agregarAlCarrito(PRODUCTO);

    expect(carrito.agregarProducto).toHaveBeenCalledWith(PRODUCTO);
    expect(pagina.mensajeCarrito()).toContain(PRODUCTO.nombre);
  });
});

const PRODUCTO: Producto = {
  idProducto: 7,
  idTienda: 3,
  nombreTienda: 'Detalles REGALIA',
  idTipoProducto: 3,
  tipoProducto: 'PACK O BOX',
  nombre: 'Box premium',
  descripcion: 'Una selección especial.',
  precio: 89.9,
  stock: 4,
  disponible: true,
  imagenes: [{ urlImagen: '/producto.webp', orden: 1 }],
};
