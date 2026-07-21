import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
import { CarritoCheckoutService } from '../../../../core/carrito/carrito-checkout.service';
import { TiendaPublicaApiService } from '../../../tiendas/acceso-datos/tienda-publica-api.service';
import { ProductoApiService } from '../../acceso-datos/producto-api.service';
import { PaginaDetalleTienda } from './pagina-detalle-tienda';

describe('PaginaDetalleTienda', () => {
  it('presenta el detalle real y sus productos disponibles', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'catalogo/tiendas/:idTienda', component: PaginaDetalleTienda }]),
        {
          provide: TiendaPublicaApiService,
          useValue: {
            obtenerTiendaPublicaPorId: vi.fn(() =>
              of({
                idTienda: 8,
                nombre: 'Detalles del Valle',
                descripcion: 'Regalos preparados localmente.',
                direccionReferencia: 'Centro de Lima',
                estadoRevision: 'APROBADA',
                tiendaFormalizada: true,
                rubros: [{ idRubro: 1, nombre: 'Regalos' }],
              }),
            ),
          },
        },
        {
          provide: ProductoApiService,
          useValue: {
            obtenerProductosPorTienda: vi.fn(() =>
              of([
                {
                  idProducto: 1,
                  idTienda: 8,
                  nombreTienda: 'Detalles del Valle',
                  idTipoProducto: 3,
                  tipoProducto: 'PACK O BOX',
                  nombre: 'Box especial',
                  descripcion: 'Selección lista para regalar',
                  precio: 99,
                  stock: 5,
                  imagenes: [],
                  disponible: true,
                },
              ]),
            ),
          },
        },
        { provide: CarritoCheckoutService, useValue: { agregarProducto: vi.fn(() => true) } },
      ],
    });

    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/catalogo/tiendas/8', PaginaDetalleTienda);
    await harness.fixture.whenStable();

    expect(harness.routeNativeElement?.textContent).toContain('Detalles del Valle');
    expect(harness.routeNativeElement?.textContent).toContain('Box especial');
    expect(harness.routeNativeElement?.textContent).toContain('Tienda formalizada');
  });
});
