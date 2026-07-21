import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { SesionAutenticacionService } from '../../autenticacion/sesion-autenticacion.service';
import { errorApiInterceptor } from './error-api.interceptor';

describe('errorApiInterceptor', () => {
  it('cierra la sesión y conserva el retorno ante un 401 autenticado', async () => {
    const sesion = {
      estaAutenticado: vi.fn(() => true),
      tieneRol: vi.fn(() => false),
      cerrarSesionExpirada: vi.fn(),
    };
    const router = {
      url: '/cliente/pedidos?estado=PENDIENTE',
      navigate: vi.fn(() => Promise.resolve(true)),
    };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorApiInterceptor])),
        provideHttpClientTesting(),
        { provide: SesionAutenticacionService, useValue: sesion },
        { provide: Router, useValue: router },
      ],
    });

    const http = TestBed.inject(HttpClient);
    const controlador = TestBed.inject(HttpTestingController);
    http.get('/api/protegido').subscribe({ error: () => undefined });
    controlador
      .expectOne('/api/protegido')
      .flush(null, { status: 401, statusText: 'Unauthorized' });
    await Promise.resolve();

    expect(sesion.cerrarSesionExpirada).toHaveBeenCalledOnce();
    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      replaceUrl: true,
      queryParams: {
        retorno: '/cliente/pedidos?estado=PENDIENTE',
        motivo: 'sesion-expirada',
      },
    });
    controlador.verify();
  });
});
