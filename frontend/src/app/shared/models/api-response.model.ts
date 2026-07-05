export interface ApiResponse<T> {
  status: 'success' | 'fail' | 'error';
  data: T;
  message: string | null;
}

export interface PageApiDto<T> {
  contenido: T[];
  paginaActual: number;
  tamanioPagina: number;
  totalElementos: number;
  totalPaginas: number;
  ultimaPagina: boolean;
}
