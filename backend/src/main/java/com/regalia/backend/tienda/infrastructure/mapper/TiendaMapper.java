package com.regalia.backend.tienda.infrastructure.mapper;

import com.regalia.backend.tienda.api.dto.TiendaRequest;
import com.regalia.backend.tienda.api.dto.TiendaResponse;
import com.regalia.backend.tienda.infrastructure.entity.TiendaEntity;
import com.regalia.backend.usuariodocumento.infrastructure.entity.UsuarioDocumentoEntity;
import com.regalia.backend.vendedor.infrastructure.entity.VendedorEntity;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Mapper para convertir entre TiendaEntity y sus DTOs.
 */
@Component
public class TiendaMapper {

    public TiendaEntity toEntity(
            TiendaRequest request,
            VendedorEntity vendedor,
            UsuarioDocumentoEntity documentoFiscal
    ) {
        TiendaEntity entity = new TiendaEntity();

        entity.setVendedor(vendedor);
        entity.setNombre(normalizarTexto(request.nombre()));
        entity.setDescripcion(normalizarTextoOpcional(request.descripcion()));
        entity.setDireccionReferencia(normalizarTextoOpcional(request.direccionReferencia()));
        entity.setDocumentoFiscal(documentoFiscal);
        entity.setEstadoRevision("PENDIENTE");
        entity.setEstado(true);

        return entity;
    }

    public TiendaResponse toResponse(
            TiendaEntity entity,
            Boolean tiendaFormalizada,
            List<TiendaResponse.RubroResumen> rubros
    ) {
        UsuarioDocumentoEntity documentoFiscal = entity.getDocumentoFiscal();

        return new TiendaResponse(
                entity.getIdTienda(),
                entity.getVendedor().getIdVendedor(),
                entity.getVendedor().getUsuario().getIdUsuario(),
                entity.getVendedor().getUsuario().getNombre(),
                entity.getVendedor().getUsuario().getApellido(),
                entity.getVendedor().getUsuario().getCorreo(),
                entity.getNombre(),
                entity.getDescripcion(),
                entity.getDireccionReferencia(),
                entity.getEstadoRevision(),
                tiendaFormalizada,
                documentoFiscal != null ? documentoFiscal.getIdUsuarioDocumento() : null,
                documentoFiscal != null ? documentoFiscal.getNumeroDocumento() : null,
                rubros,
                entity.getEstado(),
                entity.getFechaCreacion(),
                entity.getFechaActualizacion()
        );
    }

    public void actualizarEntity(
            TiendaEntity entity,
            TiendaRequest request,
            UsuarioDocumentoEntity documentoFiscal
    ) {
        entity.setNombre(normalizarTexto(request.nombre()));
        entity.setDescripcion(normalizarTextoOpcional(request.descripcion()));
        entity.setDireccionReferencia(normalizarTextoOpcional(request.direccionReferencia()));
        entity.setDocumentoFiscal(documentoFiscal);
    }

    private String normalizarTexto(String texto) {
        return texto.trim();
    }

    private String normalizarTextoOpcional(String texto) {
        if (texto == null || texto.isBlank()) {
            return null;
        }

        return texto.trim();
    }
}