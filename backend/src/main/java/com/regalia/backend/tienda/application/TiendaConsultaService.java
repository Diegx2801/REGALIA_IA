package com.regalia.backend.tienda.application;

import com.regalia.backend.shared.exception.RecursoNoEncontradoException;
import com.regalia.backend.tienda.api.dto.TiendaPublicaDetalleResponse;
import com.regalia.backend.tienda.api.dto.TiendaPublicaResponse;
import com.regalia.backend.tienda.infrastructure.entity.TiendaEntity;
import com.regalia.backend.tienda.infrastructure.mapper.TiendaMapper;
import com.regalia.backend.tienda.infrastructure.repository.TiendaJpaRepository;
import com.regalia.backend.tiendaimagen.infrastructure.entity.TiendaImagenEntity;
import com.regalia.backend.tiendaimagen.infrastructure.entity.TipoImagenTienda;
import com.regalia.backend.tiendaimagen.infrastructure.repository.TiendaImagenJpaRepository;
import com.regalia.backend.tiendarubro.infrastructure.repository.TiendaRubroJpaRepository;
import com.regalia.backend.usuariodocumento.infrastructure.entity.UsuarioDocumentoEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Servicio de consulta pública de tiendas para el marketplace.
 *
 * No gestiona tiendas del vendedor.
 * Solo consulta tiendas activas y aptas para mostrarse públicamente.
 */
@Service
@RequiredArgsConstructor
public class TiendaConsultaService {

    private static final String ESTADO_REVISION_APROBADA = "APROBADA";
    private static final String ESTADO_DOCUMENTO_VERIFICADO = "VERIFICADO";
    private static final String CATEGORIA_FISCAL = "FISCAL";

    private final TiendaJpaRepository tiendaJpaRepository;
    private final TiendaRubroJpaRepository tiendaRubroJpaRepository;
    private final TiendaImagenJpaRepository tiendaImagenJpaRepository;
    private final TiendaMapper tiendaMapper;

    @Transactional(readOnly = true)
    public List<TiendaPublicaResponse> listarTiendasPublicas() {
        List<TiendaEntity> tiendas = tiendaJpaRepository
                .findTiendasPublicas(ESTADO_REVISION_APROBADA);
        Map<Long, Map<TipoImagenTienda, String>> imagenesPorTienda = urlsImagenesPorTienda(tiendas);

        return tiendas
                .stream()
                .map(tienda -> construirTiendaPublicaResponse(
                        tienda,
                        imagenesPorTienda.getOrDefault(tienda.getIdTienda(), Map.of())
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public TiendaPublicaDetalleResponse obtenerTiendaPublicaPorId(Long idTienda) {
        TiendaEntity tienda = tiendaJpaRepository
                .findTiendaPublicaById(
                        idTienda,
                        ESTADO_REVISION_APROBADA
                )
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "No se encontró la tienda solicitada"
                ));

        return construirTiendaPublicaDetalleResponse(tienda, urlsImagenes(tienda.getIdTienda()));
    }

    private TiendaPublicaResponse construirTiendaPublicaResponse(
            TiendaEntity tienda,
            Map<TipoImagenTienda, String> imagenes
    ) {
        List<TiendaPublicaResponse.RubroResumen> rubros = tiendaRubroJpaRepository
                .findByTiendaIdTiendaAndEstadoTrueOrderByRubroNombreAsc(tienda.getIdTienda())
                .stream()
                .map(tiendaMapper::toPublicaRubroResumen)
                .toList();

        Boolean tiendaFormalizada = calcularTiendaFormalizada(tienda);
        return tiendaMapper.toPublicaResponse(
                tienda,
                tiendaFormalizada,
                imagenes.get(TipoImagenTienda.LOGO),
                imagenes.get(TipoImagenTienda.PORTADA),
                rubros
        );
    }

    private TiendaPublicaDetalleResponse construirTiendaPublicaDetalleResponse(
            TiendaEntity tienda,
            Map<TipoImagenTienda, String> imagenes
    ) {
        List<TiendaPublicaDetalleResponse.RubroResumen> rubros = tiendaRubroJpaRepository
                .findByTiendaIdTiendaAndEstadoTrueOrderByRubroNombreAsc(tienda.getIdTienda())
                .stream()
                .map(tiendaMapper::toPublicaDetalleRubroResumen)
                .toList();

        Boolean tiendaFormalizada = calcularTiendaFormalizada(tienda);
        return tiendaMapper.toPublicaDetalleResponse(
                tienda,
                tiendaFormalizada,
                imagenes.get(TipoImagenTienda.LOGO),
                imagenes.get(TipoImagenTienda.PORTADA),
                rubros
        );
    }

    private Map<TipoImagenTienda, String> urlsImagenes(Long idTienda) {
        return tiendaImagenJpaRepository.findByTiendaIdTienda(idTienda)
                .stream()
                .collect(Collectors.toMap(
                        TiendaImagenEntity::getTipo,
                        TiendaImagenEntity::getUrlImagen
                ));
    }

    private Map<Long, Map<TipoImagenTienda, String>> urlsImagenesPorTienda(
            List<TiendaEntity> tiendas
    ) {
        if (tiendas.isEmpty()) {
            return Map.of();
        }

        return tiendaImagenJpaRepository.findByTiendaIdTiendaIn(
                        tiendas.stream().map(TiendaEntity::getIdTienda).toList()
                )
                .stream()
                .collect(Collectors.groupingBy(
                        imagen -> imagen.getTienda().getIdTienda(),
                        Collectors.toMap(
                                TiendaImagenEntity::getTipo,
                                TiendaImagenEntity::getUrlImagen
                        )
                ));
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
