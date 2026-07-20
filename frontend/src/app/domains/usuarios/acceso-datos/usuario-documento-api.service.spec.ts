import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ENDPOINTS_API } from '../../../core/configuracion/endpoints-api';
import { UsuarioDocumentoApiService } from './usuario-documento-api.service';

describe('UsuarioDocumentoApiService', () => {
  let service: UsuarioDocumentoApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(UsuarioDocumentoApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('consulta y transforma los documentos del usuario autenticado', () => {
    let abreviatura = '';

    service.obtenerDocumentos().subscribe((documentos) => {
      abreviatura = documentos[0]?.abreviatura ?? '';
    });

    const request = httpMock.expectOne(ENDPOINTS_API.usuarios.documentos);
    expect(request.request.method).toBe('GET');
    request.flush({
      status: 'success',
      data: [
        {
          idUsuarioDocumento: 10,
          idTipoDocumento: 2,
          tipoDocumento: 'Documento Nacional de Identidad',
          abreviatura: 'dni',
          idCategoriaDocumento: 1,
          categoriaDocumento: 'Identidad',
          numeroDocumento: '12345678',
          estadoVerificacion: 'PENDIENTE',
          estado: true,
          fechaCreacion: '2026-07-19T10:00:00',
          fechaActualizacion: null,
        },
      ],
      message: null,
    });

    expect(abreviatura).toBe('DNI');
  });

  it('normaliza el documento antes de enviarlo a revision', () => {
    service.registrarDocumento({ idTipoDocumento: 3, numeroDocumento: '  abc-123  ' }).subscribe();

    const request = httpMock.expectOne(ENDPOINTS_API.usuarios.documentos);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      idTipoDocumento: 3,
      numeroDocumento: 'ABC-123',
    });
    request.flush({
      status: 'success',
      data: {
        idUsuarioDocumento: 11,
        idTipoDocumento: 3,
        tipoDocumento: 'Carné de extranjería',
        abreviatura: 'CE',
        idCategoriaDocumento: 1,
        categoriaDocumento: 'Identidad',
        numeroDocumento: 'ABC-123',
        estadoVerificacion: 'PENDIENTE',
        estado: true,
        fechaCreacion: null,
        fechaActualizacion: null,
      },
      message: null,
    });
  });

  it('consulta el RUC y compone su ubicacion', () => {
    let ubicacion = '';

    service.consultarRuc('20123456789').subscribe((consulta) => {
      ubicacion = consulta.ubicacion;
    });

    const request = httpMock.expectOne(ENDPOINTS_API.usuarios.consultarRuc('20123456789'));
    expect(request.request.method).toBe('GET');
    request.flush({
      status: 'success',
      data: {
        ruc: '20123456789',
        razonSocial: 'REGALIA DEMO SAC',
        nombreComercial: 'Regalia',
        estado: 'ACTIVO',
        condicion: 'HABIDO',
        direccion: 'Av. Principal 123',
        departamento: 'LA LIBERTAD',
        provincia: 'TRUJILLO',
        distrito: 'TRUJILLO',
      },
      message: null,
    });

    expect(ubicacion).toBe('TRUJILLO, TRUJILLO, LA LIBERTAD');
  });

  it('registra el RUC confirmado con el contrato esperado', () => {
    service.registrarRuc(' 20123456789 ').subscribe();

    const request = httpMock.expectOne(ENDPOINTS_API.usuarios.registrarRuc);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ numeroRuc: '20123456789' });
    request.flush({
      status: 'success',
      data: {
        idUsuarioDocumento: 12,
        idTipoDocumento: 4,
        tipoDocumento: 'Registro Único de Contribuyentes',
        abreviatura: 'RUC',
        idCategoriaDocumento: 2,
        categoriaDocumento: 'Tributario',
        numeroDocumento: '20123456789',
        estadoVerificacion: 'PENDIENTE',
        estado: true,
        fechaCreacion: null,
        fechaActualizacion: null,
      },
      message: null,
    });
  });
});
