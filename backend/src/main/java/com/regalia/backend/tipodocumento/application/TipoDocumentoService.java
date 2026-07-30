package com.regalia.backend.tipodocumento.application;

import com.regalia.backend.shared.exception.RecursoNoEncontradoException;
import com.regalia.backend.tipodocumento.api.dto.TipoDocumentoResponse;
import com.regalia.backend.tipodocumento.infrastructure.entity.TipoDocumentoEntity;
import com.regalia.backend.tipodocumento.infrastructure.mapper.TipoDocumentoMapper;
import com.regalia.backend.tipodocumento.infrastructure.repository.TipoDocumentoJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Servicio de consulta para los tipos de documento configurados por despliegue.
 */
@Service
@RequiredArgsConstructor
public class TipoDocumentoService {

    private final TipoDocumentoJpaRepository tipoDocumentoRepository;
    private final TipoDocumentoMapper tipoDocumentoMapper;

    @Transactional(readOnly = true)
    public List<TipoDocumentoResponse> listarActivos() {
        return tipoDocumentoRepository.findByEstadoTrueOrderByIdTipoDocumentoAsc().stream()
                .map(tipoDocumentoMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TipoDocumentoResponse> listarTiposDocumentoAdministracion() {
        return tipoDocumentoRepository.findAllByOrderByIdTipoDocumentoAsc().stream()
                .map(tipoDocumentoMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TipoDocumentoResponse buscarPorId(Long id) {
        return tipoDocumentoMapper.toResponse(obtenerEntidadActivaPorId(id));
    }

    @Transactional(readOnly = true)
    public TipoDocumentoResponse buscarTipoDocumentoAdministracionPorId(Long id) {
        TipoDocumentoEntity tipoDocumento = tipoDocumentoRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontro el tipo de documento solicitado"));

        return tipoDocumentoMapper.toResponse(tipoDocumento);
    }

    private TipoDocumentoEntity obtenerEntidadActivaPorId(Long id) {
        return tipoDocumentoRepository.findByIdTipoDocumentoAndEstadoTrue(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontro el tipo de documento solicitado"));
    }
}
