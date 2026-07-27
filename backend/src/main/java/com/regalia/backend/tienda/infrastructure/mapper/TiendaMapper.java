package com.regalia.backend.tienda.infrastructure.mapper;

import com.regalia.backend.tienda.api.dto.TiendaPublicaDetalleResponse;
import com.regalia.backend.tienda.api.dto.TiendaPublicaResponse;
import com.regalia.backend.tienda.api.dto.TiendaRequest;
import com.regalia.backend.tienda.api.dto.TiendaResponse;
import com.regalia.backend.tienda.infrastructure.entity.TiendaEntity;
import com.regalia.backend.tiendarubro.infrastructure.entity.TiendaRubroEntity;
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
            String urlLogo,
            String urlPortada,
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
                urlLogo,
                urlPortada,
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

    public TiendaPublicaResponse toPublicaResponse(
            TiendaEntity tienda,
            Boolean tiendaFormalizada,
            String urlLogo,
            String urlPortada,
            List<TiendaPublicaResponse.RubroResumen> rubros
    ) {
        return new TiendaPublicaResponse(
                tienda.getIdTienda(),
                tienda.getNombre(),
                tienda.getDescripcion(),
                tienda.getDireccionReferencia(),
                tiendaFormalizada,
                urlLogo,
                urlPortada,
                rubros
        );
    }

    public TiendaPublicaDetalleResponse toPublicaDetalleResponse(
            TiendaEntity tienda,
            Boolean tiendaFormalizada,
            String urlLogo,
            String urlPortada,
            List<TiendaPublicaDetalleResponse.RubroResumen> rubros
    ) {
        return new TiendaPublicaDetalleResponse(
                tienda.getIdTienda(),
                tienda.getNombre(),
                tienda.getDescripcion(),
                tienda.getDireccionReferencia(),
                tiendaFormalizada,
                urlLogo,
                urlPortada,
                rubros,
                tienda.getFechaCreacion()
        );
    }

    public TiendaPublicaResponse.RubroResumen toPublicaRubroResumen(
            TiendaRubroEntity relacion
    ) {
        return new TiendaPublicaResponse.RubroResumen(
                relacion.getRubro().getIdRubro(),
                relacion.getRubro().getNombre()
        );
    }

    public TiendaPublicaDetalleResponse.RubroResumen toPublicaDetalleRubroResumen(
            TiendaRubroEntity relacion
    ) {
        return new TiendaPublicaDetalleResponse.RubroResumen(
                relacion.getRubro().getIdRubro(),
                relacion.getRubro().getNombre()
        );
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
