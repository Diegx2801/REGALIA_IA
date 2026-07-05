export type PaymentGatewayProviderApi = 'MERCADO_PAGO';

export interface PaymentCheckoutItemApiDto {
  idProducto: number;
  cantidad: number;
}

export interface CreatePaymentCheckoutSessionApiRequest {
  provider: PaymentGatewayProviderApi;
  idTienda: number;
  idTipoEntrega: number;
  codigoTipoPago: string;
  fechaEntrega: string;
  observacion: string | null;
  items: PaymentCheckoutItemApiDto[];
}

export interface PaymentCheckoutSessionApiDto {
  provider: PaymentGatewayProviderApi;
  preferenceId: string;
  externalReference: string;
  amount: number;
  currency: string;
  initPoint: string;
  sandboxInitPoint: string | null;
  redirectUrl: string;
}
