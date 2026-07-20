import { TipoDocumentoDto } from '../modelos/tipo-documento.dto';
import { TipoDocumento } from '../modelos/tipo-documento.model';

export function mapearTipoDocumentoDesdeDto(dto: TipoDocumentoDto): TipoDocumento {
  return {
    idTipoDocumento: dto.idTipoDocumento,
    idCategoriaDocumento: dto.idCategoriaDocumento,
    categoriaDocumento: dto.categoriaDocumento?.trim() || 'Documento personal',
    nombre: dto.nombre?.trim() || 'Documento',
    abreviatura: dto.abreviatura?.trim().toUpperCase() || 'DOC',
    longitudMinima: dto.longitudMinima ?? 1,
    longitudMaxima: dto.longitudMaxima ?? 30,
  };
}
