export interface CheckoutItemRequestDto {
  idProducto: number;
  cantidad: number;
}

export interface CheckoutSessionRequestDto {
  provider: string;
  idTienda: number;
  idTipoEntrega: number;
  codigoTipoPago: string;
  fechaEntrega: string;
  observacion: string | null;
  items: CheckoutItemRequestDto[];
}

export interface CheckoutSessionResponseDto {
  provider: string;
  preferenceId: string | null;
  externalReference: string | null;
  amount: number;
  currency: string;
  initPoint: string | null;
  sandboxInitPoint: string | null;
  redirectUrl: string | null;
}

export interface OpcionPagoInicialDto {
  codigo: string;
  nombre: string;
  descripcion: string | null;
}
