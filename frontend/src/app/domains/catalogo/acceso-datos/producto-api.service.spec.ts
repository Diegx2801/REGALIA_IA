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

  it('consulta una pagina con filtros y transforma sus productos al modelo de vista', () => {
    let nombres: string[] = [];
    let totalElementos = 0;

    service
      .obtenerProductos({
        page: 1,
        size: 12,
        search: 'box',
        idTipoProducto: 3,
        precioMaximo: 150,
        soloDisponibles: true,
        orden: 'priceAsc',
      })
      .subscribe((pagina) => {
        nombres = pagina.contenido.map((producto) => producto.nombre);
        totalElementos = pagina.totalElementos;
      });

    const request = httpMock.expectOne((solicitud) => {
      const params = solicitud.params;
      return (
        solicitud.url === ENDPOINTS_API.catalogo.productos &&
        params.get('page') === '1' &&
        params.get('size') === '12' &&
        params.get('search') === 'box' &&
        params.get('idTipoProducto') === '3' &&
        params.get('precioMaximo') === '150' &&
        params.get('soloDisponibles') === 'true' &&
        params.get('sort') === 'precio,asc'
      );
    });
    expect(request.request.method).toBe('GET');
    request.flush({
      status: 'success',
      data: {
        contenido: [
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
        paginaActual: 1,
        tamanioPagina: 12,
        totalElementos: 15,
        totalPaginas: 2,
        ultimaPagina: true,
      },
      message: null,
    });

    expect(nombres).toEqual(['Box mama edicion especial']);
    expect(totalElementos).toBe(15);
  });

  it('envia el orden recomendado y valores predeterminados cuando no recibe filtros', () => {
    service.obtenerProductos().subscribe();

    const request = httpMock.expectOne((solicitud) => {
      const params = solicitud.params;
      return (
        solicitud.url === ENDPOINTS_API.catalogo.productos &&
        params.get('page') === '0' &&
        params.get('size') === '12' &&
        params.get('soloDisponibles') === 'true' &&
        params.get('sort') === 'recomendado,asc'
      );
    });

    request.flush({ status: 'success', data: null, message: null });
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
