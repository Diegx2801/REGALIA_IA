package com.regalia.backend.tipoentrega.application;

import com.regalia.backend.shared.exception.RecursoNoEncontradoException;
import com.regalia.backend.tipoentrega.api.dto.TipoEntregaResponse;
import com.regalia.backend.tipoentrega.infrastructure.entity.TipoEntregaEntity;
import com.regalia.backend.tipoentrega.infrastructure.mapper.TipoEntregaMapper;
import com.regalia.backend.tipoentrega.infrastructure.repository.TipoEntregaJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Servicio de consulta para las modalidades de entrega configuradas por despliegue.
 */
@Service
@RequiredArgsConstructor
public class TipoEntregaService {

    private final TipoEntregaJpaRepository tipoEntregaJpaRepository;
    private final TipoEntregaMapper tipoEntregaMapper;

    @Transactional(readOnly = true)
    public List<TipoEntregaResponse> listarTiposEntregaActivos() {
        return tipoEntregaJpaRepository.findByEstadoTrueOrderByNombreAsc().stream()
                .map(tipoEntregaMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TipoEntregaResponse> listarTiposEntregaAdministracion() {
        return tipoEntregaJpaRepository.findAllByOrderByNombreAsc().stream()
                .map(tipoEntregaMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TipoEntregaResponse obtenerTipoEntregaPorId(Long idTipoEntrega) {
        return tipoEntregaMapper.toResponse(obtenerTipoEntregaActivo(idTipoEntrega));
    }

    @Transactional(readOnly = true)
    public TipoEntregaResponse obtenerTipoEntregaAdministracionPorId(Long idTipoEntrega) {
        TipoEntregaEntity tipoEntrega = tipoEntregaJpaRepository.findById(idTipoEntrega)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontro el tipo de entrega solicitado"));

        return tipoEntregaMapper.toResponse(tipoEntrega);
    }

    private TipoEntregaEntity obtenerTipoEntregaActivo(Long idTipoEntrega) {
        return tipoEntregaJpaRepository.findByIdTipoEntregaAndEstadoTrue(idTipoEntrega)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontro el tipo de entrega solicitado"));
    }
}
