import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ENDPOINTS_API } from '../../../core/configuracion/endpoints-api';
import { PanelAdministracionApiService } from './panel-administracion-api.service';

describe('PanelAdministracionApiService', () => {
  let service: PanelAdministracionApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(PanelAdministracionApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('desactiva un usuario y transforma la respuesta del backend', () => {
    let estado = true;

    service.desactivarUsuario(15).subscribe((usuario) => {
      estado = usuario.estado;
    });

    const request = httpMock.expectOne(ENDPOINTS_API.administracion.desactivarUsuario(15));
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({});
    request.flush(crearRespuestaUsuario(false));

    expect(estado).toBe(false);
  });

  it('reactiva un usuario usando el endpoint administrativo', () => {
    let estado = false;

    service.reactivarUsuario(15).subscribe((usuario) => {
      estado = usuario.estado;
    });

    const request = httpMock.expectOne(ENDPOINTS_API.administracion.reactivarUsuario(15));
    expect(request.request.method).toBe('PATCH');
    request.flush(crearRespuestaUsuario(true));

    expect(estado).toBe(true);
  });
});

function crearRespuestaUsuario(estado: boolean) {
  return {
    status: 'success',
    data: {
      idUsuario: 15,
      nombres: 'María',
      apellidos: 'Cliente',
      correo: 'maria@regalia.pe',
      telefono: '999888777',
      correoVerificado: true,
      estado,
      fechaCreacion: '2026-07-20T10:00:00',
      fechaActualizacion: '2026-07-20T11:00:00',
    },
    message: null,
  } as const;
}
