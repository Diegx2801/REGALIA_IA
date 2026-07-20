import { CanDeactivateFn } from '@angular/router';

export interface EditorProductoConCambiosPendientes {
  confirmarSalida(): boolean;
}

/** Protege el catálogo del vendedor frente a descartes accidentales. */
export const confirmarCambiosProductoGuard: CanDeactivateFn<EditorProductoConCambiosPendientes> = (
  componente,
) => componente.confirmarSalida();
