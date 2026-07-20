import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import {
  confirmarCambiosTiendaGuard,
  EditorTiendaConCambiosPendientes,
} from './confirmar-cambios-tienda.guard';

describe('confirmarCambiosTiendaGuard', () => {
  it('delega la decisión de salida en el editor de tienda', () => {
    const componente: EditorTiendaConCambiosPendientes = {
      confirmarSalida: vi.fn(() => false),
    };

    const resultado = confirmarCambiosTiendaGuard(
      componente,
      {} as ActivatedRouteSnapshot,
      {} as RouterStateSnapshot,
      {} as RouterStateSnapshot,
    );

    expect(resultado).toBe(false);
    expect(componente.confirmarSalida).toHaveBeenCalledOnce();
  });
});
