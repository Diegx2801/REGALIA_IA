import { RubroDto } from '../modelos/rubro.dto';
import { Rubro } from '../modelos/rubro.model';

export function mapearRubroDesdeDto(dto: RubroDto): Rubro {
  return {
    idRubro: dto.idRubro,
    nombre: dto.nombre?.trim() || 'Rubro comercial',
    descripcion: dto.descripcion?.trim() || 'Categoria comercial de tienda.',
    estado: Boolean(dto.estado),
  };
}
