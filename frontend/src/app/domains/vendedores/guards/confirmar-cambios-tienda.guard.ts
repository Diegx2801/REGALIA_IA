import { CanDeactivateFn } from '@angular/router';

export interface EditorTiendaConCambiosPendientes {
  confirmarSalida(): boolean;
}

/** Evita descartar accidentalmente cambios del formulario comercial de una tienda. */
export const confirmarCambiosTiendaGuard: CanDeactivateFn<EditorTiendaConCambiosPendientes> = (
  componente,
) => componente.confirmarSalida();
