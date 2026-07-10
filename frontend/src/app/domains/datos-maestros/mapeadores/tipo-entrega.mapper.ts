import { TipoEntregaDto } from '../modelos/tipo-entrega.dto';
import { TipoEntrega } from '../modelos/tipo-entrega.model';

export function mapearTipoEntregaDesdeDto(dto: TipoEntregaDto): TipoEntrega {
  return {
    idTipoEntrega: dto.idTipoEntrega,
    nombre: dto.nombre?.trim() || 'Entrega coordinada',
  };
}
