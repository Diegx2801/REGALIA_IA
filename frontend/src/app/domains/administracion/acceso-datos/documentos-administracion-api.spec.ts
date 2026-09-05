import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ENDPOINTS_API } from '../../../core/configuracion/endpoints-api';
import { DocumentosAdministracionApi } from './documentos-administracion-api';

describe('DocumentosAdministracionApi', () => {
  let api: DocumentosAdministracionApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(DocumentosAdministracionApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('filtra documentos por estado y adapta el contrato administrativo', () => {
    let nombre = '';
    api
      .listar({ estado: 'PENDIENTE' })
      .subscribe((pagina) => (nombre = pagina.contenido[0]?.nombreCompleto ?? ''));

    const request = http.expectOne(
      (solicitud) =>
        solicitud.url === ENDPOINTS_API.administracion.documentos &&
        solicitud.params.get('estadoVerificacion') === 'PENDIENTE',
    );
    request.flush({
      status: 'success',
      data: {
        contenido: [DOCUMENTO_DTO],
        paginaActual: 0,
        tamanioPagina: 10,
        totalElementos: 1,
        totalPaginas: 1,
        ultimaPagina: true,
      },
      message: null,
    });

    expect(nombre).toBe('Ana Pérez');
  });

  it('envía la acción documental mediante PATCH', () => {
    api.cambiarEstado(4, 'verificar').subscribe();

    const request = http.expectOne(ENDPOINTS_API.administracion.accionDocumento(4, 'verificar'));
    expect(request.request.method).toBe('PATCH');
    request.flush({
      status: 'success',
      data: { ...DOCUMENTO_DTO, estadoVerificacion: 'VERIFICADO' },
      message: null,
    });
  });
});

const DOCUMENTO_DTO = {
  idUsuarioDocumento: 4,
  idUsuario: 9,
  nombreUsuario: 'Ana',
  apellidoUsuario: 'Pérez',
  correoUsuario: 'ana@regalia.test',
  idTipoDocumento: 1,
  tipoDocumento: 'Documento Nacional de Identidad',
  abreviatura: 'DNI',
  idCategoriaDocumento: 1,
  categoriaDocumento: 'Identidad',
  numeroDocumento: '12345678',
  estadoVerificacion: 'PENDIENTE',
  estado: true,
  fechaCreacion: '2026-07-20T10:00:00',
  fechaActualizacion: null,
};
