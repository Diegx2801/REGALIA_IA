import { HttpErrorResponse } from '@angular/common/http';
import { TimeoutError } from 'rxjs';

export type TipoErrorApi =
  | 'red'
  | 'timeout'
  | 'validacion'
  | 'autenticacion'
  | 'autorizacion'
  | 'no-encontrado'
  | 'conflicto'
  | 'limite'
  | 'servidor'
  | 'desconocido';

export interface DetalleErrorApi {
  tipo: TipoErrorApi;
  mensajeUsuario: string;
  estado?: number;
  mensajeTecnico?: string;
  errores?: unknown;
  datos?: unknown;
}

export class ErrorApiRegalia extends Error {
  readonly tipo: TipoErrorApi;
  readonly estado?: number;
  readonly mensajeTecnico?: string;
  readonly errores?: unknown;
  readonly datos?: unknown;

  constructor(detalle: DetalleErrorApi) {
    super(detalle.mensajeUsuario);
    this.name = 'ErrorApiRegalia';
    this.tipo = detalle.tipo;
    this.estado = detalle.estado;
    this.mensajeTecnico = detalle.mensajeTecnico;
    this.errores = detalle.errores;
    this.datos = detalle.datos;
  }
}

const MENSAJE_ERROR_GENERICO = 'No se pudo completar la operacion. Intentalo nuevamente.';

export function normalizarErrorApi(error: unknown): ErrorApiRegalia {
  if (error instanceof ErrorApiRegalia) return error;

  // Los interceptores entregan HttpErrorResponse; aqui se traduce a un error de dominio frontend.
  if (error instanceof HttpErrorResponse) {
    return normalizarErrorHttp(error);
  }

  // timeout() vive en los servicios de datos; por eso tambien se normaliza fuera del interceptor.
  if (esTimeout(error)) {
    return new ErrorApiRegalia({
      tipo: 'timeout',
      mensajeUsuario: 'El backend de REGALIA tardo demasiado en responder. Intentalo nuevamente.',
      mensajeTecnico: obtenerMensajeTecnico(error),
    });
  }

  if (esErrorRedGenerico(error)) {
    return new ErrorApiRegalia({
      tipo: 'red',
      mensajeUsuario:
        'No pudimos conectar con el backend de REGALIA. Verifica que el servidor este activo.',
      mensajeTecnico: obtenerMensajeTecnico(error),
    });
  }

  return new ErrorApiRegalia({
    tipo: 'desconocido',
    mensajeUsuario: obtenerMensajeTecnico(error) || MENSAJE_ERROR_GENERICO,
    mensajeTecnico: obtenerMensajeTecnico(error),
  });
}

export function obtenerMensajeErrorUsuario(
  error: unknown,
  mensajePorDefecto = MENSAJE_ERROR_GENERICO,
): string {
  const errorNormalizado = normalizarErrorApi(error);
  return errorNormalizado.message || mensajePorDefecto;
}

function normalizarErrorHttp(error: HttpErrorResponse): ErrorApiRegalia {
  const mensajeBackend = extraerMensajeBackend(error.error);
  const mensajeTecnico = error.message;
  const estado = error.status;
  const datos = extraerDatosBackend(error.error);

  if (estado === 0) {
    return new ErrorApiRegalia({
      tipo: 'red',
      estado,
      mensajeUsuario:
        'No pudimos conectar con el backend de REGALIA. Verifica que el servidor este activo.',
      mensajeTecnico,
      errores: error.error,
      datos,
    });
  }

  if (estado === 400 || estado === 422) {
    return new ErrorApiRegalia({
      tipo: 'validacion',
      estado,
      mensajeUsuario:
        mensajeBackend || 'La informacion enviada no es valida. Revisa el formulario.',
      mensajeTecnico,
      errores: error.error,
      datos,
    });
  }

  if (estado === 401) {
    return new ErrorApiRegalia({
      tipo: 'autenticacion',
      estado,
      mensajeUsuario:
        mensajeBackend || 'Tu sesion no es valida o las credenciales son incorrectas.',
      mensajeTecnico,
      errores: error.error,
      datos,
    });
  }

  if (estado === 403) {
    return new ErrorApiRegalia({
      tipo: 'autorizacion',
      estado,
      mensajeUsuario: mensajeBackend || 'No tienes permisos para realizar esta accion.',
      mensajeTecnico,
      errores: error.error,
      datos,
    });
  }

  if (estado === 404) {
    return new ErrorApiRegalia({
      tipo: 'no-encontrado',
      estado,
      mensajeUsuario: mensajeBackend || 'No encontramos el recurso solicitado.',
      mensajeTecnico,
      errores: error.error,
      datos,
    });
  }

  if (estado === 409) {
    return new ErrorApiRegalia({
      tipo: 'conflicto',
      estado,
      mensajeUsuario: mensajeBackend || 'La operacion entra en conflicto con el estado actual.',
      mensajeTecnico,
      errores: error.error,
      datos,
    });
  }

  if (estado === 429) {
    return new ErrorApiRegalia({
      tipo: 'limite',
      estado,
      mensajeUsuario:
        mensajeBackend || 'Has realizado demasiados intentos. Inténtalo nuevamente más tarde.',
      mensajeTecnico,
      errores: error.error,
      datos,
    });
  }

  if (estado >= 500) {
    return new ErrorApiRegalia({
      tipo: 'servidor',
      estado,
      mensajeUsuario:
        mensajeBackend || 'El backend de REGALIA tuvo un problema. Intentalo nuevamente.',
      mensajeTecnico,
      errores: error.error,
      datos,
    });
  }

  return new ErrorApiRegalia({
    tipo: 'desconocido',
    estado,
    mensajeUsuario: mensajeBackend || MENSAJE_ERROR_GENERICO,
    mensajeTecnico,
    errores: error.error,
    datos,
  });
}

function extraerMensajeBackend(error: unknown): string {
  if (!error) return '';

  // El contrato de REGALIA siempre entrega errores JSON. Una respuesta de texto suele provenir
  // del proxy, del servidor web o de una pagina HTML intermedia y no debe exponerse en la UI.
  if (typeof error === 'string') return '';

  if (typeof error === 'object') {
    // Soporta contratos frecuentes del backend sin acoplar el frontend a una sola forma de error.
    const respuesta = error as Record<string, unknown>;
    const mensaje = respuesta['message'] ?? respuesta['mensaje'] ?? respuesta['error'];
    return typeof mensaje === 'string' ? mensaje : '';
  }

  return '';
}

function extraerDatosBackend(error: unknown): unknown {
  if (!error || typeof error !== 'object') return undefined;

  const respuesta = error as Record<string, unknown>;
  return respuesta['data'] ?? respuesta['datos'];
}

function esTimeout(error: unknown): boolean {
  return error instanceof TimeoutError || obtenerNombreError(error) === 'TimeoutError';
}

function esErrorRedGenerico(error: unknown): boolean {
  const mensaje = obtenerMensajeTecnico(error);
  return mensaje.includes('Http failure response') || mensaje.includes('Unknown Error');
}

function obtenerNombreError(error: unknown): string {
  return error instanceof Error ? error.name : '';
}

function obtenerMensajeTecnico(error: unknown): string {
  return error instanceof Error ? error.message : '';
}
