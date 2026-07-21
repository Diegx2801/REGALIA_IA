import { TiendaPublicaDto } from '../modelos/tienda-publica.dto';
import { TiendaPublica } from '../modelos/tienda-publica.model';

export function mapearTiendaPublicaDesdeDto(dto: TiendaPublicaDto): TiendaPublica {
  return {
    idTienda: dto.idTienda,
    nombre: dto.nombre?.trim() || 'Tienda REGALIA',
    descripcion: dto.descripcion?.trim() || 'Descripcion pendiente',
    direccionReferencia: dto.direccionReferencia?.trim() || 'Ubicacion pendiente',
    estadoRevision: dto.estadoRevision?.trim() || 'PENDIENTE',
    tiendaFormalizada: Boolean(dto.tiendaFormalizada),
    fechaCreacion: dto.fechaCreacion ?? null,
    rubros: (dto.rubros ?? []).map((rubro) => ({
      idRubro: rubro.idRubro,
      nombre: rubro.nombre?.trim() || 'Rubro REGALIA',
    })),
  };
}
