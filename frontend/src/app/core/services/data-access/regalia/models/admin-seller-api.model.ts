export interface AdminSellerApiDto {
  idVendedor: number;
  idUsuario: number;
  nombreUsuario: string | null;
  apellidoUsuario: string | null;
  correoUsuario: string | null;
  vendedorVerificado: boolean | null;
  cantidadTiendasActivas: number | null;
  cantidadTiendasTotales: number | null;
  estado: boolean | null;
  fechaCreacion: string | null;
  fechaActualizacion: string | null;
}
