import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, UrlTree } from '@angular/router';
import { RolUsuario } from '../autenticacion/sesion-autenticacion.model';
import { SesionAutenticacionService } from '../autenticacion/sesion-autenticacion.service';
import { autenticacionGuard } from './autenticacion.guard';
import { rolGuard } from './rol.guard';

class SesionAutenticacionStub {
  autenticado = false;
  rol: RolUsuario | null = null;

  estaAutenticado(): boolean {
    return this.autenticado;
  }

  tieneRol(rolesPermitidos: RolUsuario[]): boolean {
    return this.rol !== null && rolesPermitidos.includes(this.rol);
  }
}

describe('guards de acceso', () => {
  let sesion: SesionAutenticacionStub;

  beforeEach(() => {
    sesion = new SesionAutenticacionStub();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: SesionAutenticacionService, useValue: sesion },
      ],
    });
  });

  it('permite rutas privadas cuando existe sesion activa', () => {
    sesion.autenticado = true;

    const resultado = TestBed.runInInjectionContext(() =>
      autenticacionGuard({} as ActivatedRouteSnapshot, {} as never),
    );

    expect(resultado).toBe(true);
  });

  it('redirige a login cuando no existe sesion activa', () => {
    const router = TestBed.inject(Router);
    const resultado = TestBed.runInInjectionContext(() =>
      autenticacionGuard({} as ActivatedRouteSnapshot, {} as never),
    );

    expect(resultado instanceof UrlTree).toBe(true);
    expect(router.serializeUrl(resultado as UrlTree)).toBe('/login');
  });

  it('permite acceso cuando el rol actual esta autorizado', () => {
    sesion.rol = 'VENDEDOR';

    const resultado = TestBed.runInInjectionContext(() =>
      rolGuard(crearRutaConRoles(['VENDEDOR']), {} as never),
    );

    expect(resultado).toBe(true);
  });

  it('redirige a acceso denegado cuando el rol no coincide', () => {
    sesion.rol = 'CLIENTE';
    const router = TestBed.inject(Router);

    const resultado = TestBed.runInInjectionContext(() =>
      rolGuard(crearRutaConRoles(['ADMIN']), {} as never),
    );

    expect(resultado instanceof UrlTree).toBe(true);
    expect(router.serializeUrl(resultado as UrlTree)).toBe('/acceso-denegado');
  });
});

function crearRutaConRoles(roles: RolUsuario[]): ActivatedRouteSnapshot {
  return { data: { roles } } as unknown as ActivatedRouteSnapshot;
}
