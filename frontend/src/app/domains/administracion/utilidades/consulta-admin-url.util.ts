import { ParamMap, Params } from '@angular/router';

/**
 * Utilidades pequeñas para mantener las consultas administrativas compartibles
 * por URL sin acoplar cada pantalla a detalles de serialización.
 */
export function textoDesdeUrl(parametros: ParamMap, nombre: string, defecto: string): string {
  const valor = parametros.get(nombre)?.trim();
  return valor || defecto;
}

export function enteroDesdeUrl(
  parametros: ParamMap,
  nombre: string,
  defecto: number,
  permitidos?: readonly number[],
): number {
  const valor = Number(parametros.get(nombre));
  if (!Number.isInteger(valor) || valor < 0) return defecto;
  return permitidos && !permitidos.includes(valor) ? defecto : valor;
}

export function valorPermitidoDesdeUrl<T extends string>(
  parametros: ParamMap,
  nombre: string,
  defecto: T,
  permitidos: readonly T[],
): T {
  const valor = parametros.get(nombre);
  return valor && permitidos.includes(valor as T) ? (valor as T) : defecto;
}

/** Elimina parámetros vacíos y valores por defecto para URLs compactas. */
export function parametrosDeConsulta(
  valores: Record<string, string | number | null | undefined>,
  valoresPorDefecto: Record<string, string | number | null | undefined>,
): Params {
  return Object.fromEntries(
    Object.entries(valores).map(([nombre, valor]) => [
      nombre,
      valor === '' || valor === null || valor === undefined || valor === valoresPorDefecto[nombre]
        ? null
        : valor,
    ]),
  );
}
