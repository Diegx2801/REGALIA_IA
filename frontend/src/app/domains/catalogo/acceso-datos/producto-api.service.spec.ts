import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ENDPOINTS_API } from '../../../core/configuracion/endpoints-api';
import { ProductoApiService } from './producto-api.service';

describe('ProductoApiService', () => {
  let service: ProductoApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(ProductoApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('consulta productos publicos y los transforma a modelo de vista', () => {
    let nombres: string[] = [];

    service.obtenerProductos().subscribe((productos) => {
      nombres = productos.map((producto) => producto.nombre);
    });

    const request = httpMock.expectOne(ENDPOINTS_API.catalogo.productos);
    expect(request.request.method).toBe('GET');
    request.flush({
      status: 'success',
      data: [
        {
          idProducto: 1,
          idTienda: 1,
          nombreTienda: 'Bienestar Natural',
          idTipoProducto: 3,
          tipoProducto: 'PACK O BOX',
          nombre: 'Box mama edicion especial',
          descripcion: 'Box premium',
          precio: 129,
          stock: 14,
          imagenes: [{ urlImagen: '/assets/brand/iconos/diadelamadre.png', orden: 1 }],
        },
      ],
      message: null,
    });

    expect(nombres).toEqual(['Box mama edicion especial']);
  });

  it('lanza error de dominio cuando el detalle no trae data', () => {
    let mensajeError = '';

    service.obtenerProductoPorId(99).subscribe({
      error: (error: Error) => {
        mensajeError = error.message;
      },
    });

    const request = httpMock.expectOne(ENDPOINTS_API.catalogo.productoPorId(99));
    request.flush({ status: 'fail', data: null, message: 'Producto no encontrado.' });

    expect(mensajeError).toBe('Producto no encontrado.');
  });
});
