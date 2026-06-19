package com.regalia.backend.tienda.application;

import com.regalia.backend.shared.exception.RecursoNoEncontradoException;
import com.regalia.backend.tienda.api.dto.TiendaPublicaDetalleResponse;
import com.regalia.backend.tienda.api.dto.TiendaPublicaResponse;
import com.regalia.backend.tienda.infrastructure.entity.TiendaEntity;
import com.regalia.backend.tienda.infrastructure.mapper.TiendaMapper;
import com.regalia.backend.tienda.infrastructure.repository.TiendaJpaRepository;
import com.regalia.backend.tiendarubro.infrastructure.repository.TiendaRubroJpaRepository;
import com.regalia.backend.usuariodocumento.infrastructure.entity.UsuarioDocumentoEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Servicio de consulta pública de tiendas para el marketplace.
 *
 * No gestiona tiendas del vendedor.
 * Solo consulta tiendas activas y aptas para mostrarse públicamente.
 */
@Service
@RequiredArgsConstructor
public class TiendaConsultaService {

    private static final String ESTADO_REVISION_RECHAZADA = "RECHAZADA";
    private static final String ESTADO_DOCUMENTO_VERIFICADO = "VERIFICADO";
    private static final String CATEGORIA_FISCAL = "FISCAL";

    private final TiendaJpaRepository tiendaJpaRepository;
    private final TiendaRubroJpaRepository tiendaRubroJpaRepository;
    private final TiendaMapper tiendaMapper;

    @Transactional(readOnly = true)
    public List<TiendaPublicaResponse> listarTiendasPublicas() {
        return tiendaJpaRepository
                .findByEstadoTrueAndEstadoRevisionNotOrderByIdTiendaAsc(ESTADO_REVISION_RECHAZADA)
                .stream()
                .map(this::construirTiendaPublicaResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TiendaPublicaDetalleResponse obtenerTiendaPublicaPorId(Long idTienda) {
        TiendaEntity tienda = tiendaJpaRepository
                .findByIdTiendaAndEstadoTrueAndEstadoRevisionNot(
                        idTienda,
                        ESTADO_REVISION_RECHAZADA
                )
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "No se encontró la tienda solicitada"
                ));

        return construirTiendaPublicaDetalleResponse(tienda);
    }

    private TiendaPublicaResponse construirTiendaPublicaResponse(TiendaEntity tienda) {
        List<TiendaPublicaResponse.RubroResumen> rubros = tiendaRubroJpaRepository
                .findByTiendaIdTiendaAndEstadoTrueOrderByRubroNombreAsc(tienda.getIdTienda())
                .stream()
                .map(tiendaMapper::toPublicaRubroResumen)
                .toList();

        Boolean tiendaFormalizada = calcularTiendaFormalizada(tienda);

        return tiendaMapper.toPublicaResponse(
                tienda,
                tiendaFormalizada,
                rubros
        );
    }

    private TiendaPublicaDetalleResponse construirTiendaPublicaDetalleResponse(TiendaEntity tienda) {
        List<TiendaPublicaDetalleResponse.RubroResumen> rubros = tiendaRubroJpaRepository
                .findByTiendaIdTiendaAndEstadoTrueOrderByRubroNombreAsc(tienda.getIdTienda())
                .stream()
                .map(tiendaMapper::toPublicaDetalleRubroResumen)
                .toList();

        Boolean tiendaFormalizada = calcularTiendaFormalizada(tienda);

        return tiendaMapper.toPublicaDetalleResponse(
                tienda,
                tiendaFormalizada,
                rubros
        );
    }

    private Boolean calcularTiendaFormalizada(TiendaEntity tienda) {
        UsuarioDocumentoEntity documentoFiscal = tienda.getDocumentoFiscal();

        if (documentoFiscal == null) {
            return false;
        }

        return Boolean.TRUE.equals(documentoFiscal.getEstado())
                && ESTADO_DOCUMENTO_VERIFICADO.equalsIgnoreCase(documentoFiscal.getEstadoVerificacion())
                && documentoFiscal.getTipoDocumento() != null
                && documentoFiscal.getTipoDocumento().getCategoriaDocumento() != null
                && CATEGORIA_FISCAL.equalsIgnoreCase(
                        documentoFiscal.getTipoDocumento().getCategoriaDocumento().getNombre()
                );
    }
}