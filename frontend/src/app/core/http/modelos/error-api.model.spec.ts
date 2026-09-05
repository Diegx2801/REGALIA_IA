import { HttpErrorResponse } from '@angular/common/http';
import { describe, expect, it } from 'vitest';
import { normalizarErrorApi } from './error-api.model';

describe('normalizarErrorApi', () => {
  it('no expone una pagina HTML recibida desde el servidor de desarrollo', () => {
    const error = new HttpErrorResponse({
      status: 404,
      error: '<!DOCTYPE html><html><body>Cannot POST /api/auth/login</body></html>',
      url: '/api/auth/login',
    });

    const resultado = normalizarErrorApi(error);

    expect(resultado.tipo).toBe('no-encontrado');
    expect(resultado.message).toBe('No encontramos el recurso solicitado.');
    expect(resultado.message).not.toContain('<html>');
  });

  it('conserva el mensaje seguro del contrato JSON del backend', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: { status: 'error', message: 'La informacion enviada no es valida.' },
      url: '/api/auth/login',
    });

    const resultado = normalizarErrorApi(error);

    expect(resultado.tipo).toBe('validacion');
    expect(resultado.message).toBe('La informacion enviada no es valida.');
  });

  it('normaliza el bloqueo temporal y conserva el estado de intentos', () => {
    const error = new HttpErrorResponse({
      status: 429,
      error: {
        status: 'fail',
        message: 'Demasiados intentos de inicio de sesion.',
        data: {
          intentosRestantes: 0,
          bloqueadoHasta: '2026-09-04T23:00:00Z',
          reintentarEnSegundos: 120,
        },
      },
      url: '/api/auth/login',
    });

    const resultado = normalizarErrorApi(error);

    expect(resultado.tipo).toBe('limite');
    expect(resultado.estado).toBe(429);
    expect(resultado.datos).toEqual(error.error.data);
  });
});
