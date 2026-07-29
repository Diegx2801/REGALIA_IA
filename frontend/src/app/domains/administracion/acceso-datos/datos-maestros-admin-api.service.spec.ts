import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ENDPOINTS_API } from '../../../core/configuracion/endpoints-api';
import { DatosMaestrosAdminApiService } from './datos-maestros-admin-api.service';

describe('DatosMaestrosAdminApiService', () => {
  let service: DatosMaestrosAdminApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(DatosMaestrosAdminApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('consolida los cinco catalogos de consulta', () => {
    let tipos: string[] = [];

    service.obtenerDatosMaestros().subscribe((datos) => {
      tipos = datos.map((dato) => dato.tipo);
    });

    httpMock.expectOne(ENDPOINTS_API.administracion.rubros).flush(respuesta([
      { idRubro: 1, nombre: 'Detalles', descripcion: 'Regalos', ...auditoria(true) },
    ]));
    httpMock.expectOne(ENDPOINTS_API.administracion.tiposProducto).flush(respuesta([
      { idTipoProducto: 2, nombre: 'Caja', ...auditoria(true) },
    ]));
    httpMock.expectOne(ENDPOINTS_API.administracion.tiposEntrega).flush(respuesta([
      { idTipoEntrega: 3, nombre: 'Recojo', ...auditoria(true) },
    ]));
    httpMock.expectOne(ENDPOINTS_API.administracion.tiposPago).flush(respuesta([
      { idTipoPago: 4, codigo: 'SENA', nombre: 'Pago inicial', descripcion: 'Pago parcial', ...auditoria(true) },
    ]));
    httpMock.expectOne(ENDPOINTS_API.administracion.tiposDocumento).flush(respuesta([
      {
        idTipoDocumento: 5,
        idCategoriaDocumento: 1,
        categoriaDocumento: 'PERSONA',
        nombre: 'DNI',
        abreviatura: 'DNI',
        longitudMinima: 8,
        longitudMaxima: 8,
        ...auditoria(true),
      },
    ]));

    expect(tipos).toEqual(['RUBRO', 'TIPO_PRODUCTO', 'TIPO_ENTREGA', 'TIPO_PAGO', 'TIPO_DOCUMENTO']);
  });
});

function respuesta<T>(data: T) {
  return { status: 'success' as const, data, message: null };
}

function auditoria(estado: boolean) {
  return {
    estado,
    fechaCreacion: '2026-07-01T10:00:00',
    fechaActualizacion: '2026-07-20T11:00:00',
  };
}
