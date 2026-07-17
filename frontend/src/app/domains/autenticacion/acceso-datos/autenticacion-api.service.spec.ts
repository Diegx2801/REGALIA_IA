import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ENDPOINTS_API } from '../../../core/configuracion/endpoints-api';
import { AutenticacionApiService } from './autenticacion-api.service';

describe('AutenticacionApiService', () => {
  let service: AutenticacionApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(AutenticacionApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('envia login publico al endpoint correcto y normaliza credenciales', () => {
    let token = '';

    service
      .iniciarSesionPublica({
        correo: ' Cliente.Demo@REGALIA.Local ',
        contrasena: 'Regalia123!',
      })
      .subscribe((resultado) => {
        token = resultado.token;
      });

    const request = httpMock.expectOne(ENDPOINTS_API.autenticacion.login);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      correo: 'cliente.demo@regalia.local',
      contrasena: 'Regalia123!',
    });
    request.flush({
      status: 'success',
      data: {
        token: 'jwt-publico',
        tipo: 'Bearer',
        idUsuario: 2,
        correo: 'cliente.demo@regalia.local',
        correoVerificado: false,
        roles: ['CLIENTE'],
        authContext: 'PUBLIC',
        expiraEnMinutos: 240,
      },
      message: null,
    });

    expect(token).toBe('jwt-publico');
  });

  it('usa endpoint administrativo para login admin', () => {
    service
      .iniciarSesionAdministracion({
        correo: 'admin@regalia.local',
        contrasena: 'Regalia123!',
      })
      .subscribe();

    const request = httpMock.expectOne(ENDPOINTS_API.autenticacion.loginAdministracion);
    expect(request.request.method).toBe('POST');
    request.flush({
      status: 'success',
      data: {
        token: 'jwt-admin',
        tipo: 'Bearer',
        idUsuario: 1,
        correo: 'admin@regalia.local',
        correoVerificado: true,
        roles: ['ADMIN'],
        authContext: 'ADMIN',
        expiraEnMinutos: 30,
      },
      message: null,
    });
  });
});
