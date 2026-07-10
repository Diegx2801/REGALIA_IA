export interface RespuestaApi<T> {
  status: 'success' | 'fail' | 'error';
  data: T | null;
  message: string | null;
}

export interface RespuestaPaginada<T> {
  contenido: T[];
  paginaActual: number;
  tamanioPagina: number;
  totalElementos: number;
  totalPaginas: number;
  ultimaPagina: boolean;
}
