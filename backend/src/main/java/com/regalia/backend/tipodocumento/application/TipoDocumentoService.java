package com.regalia.backend.tipodocumento.application;

import com.regalia.backend.shared.exception.RecursoDuplicadoException;
import com.regalia.backend.shared.exception.RecursoNoEncontradoException;
import com.regalia.backend.shared.exception.ReglaNegocioException;
import com.regalia.backend.tipodocumento.api.dto.TipoDocumentoRequest;
import com.regalia.backend.tipodocumento.api.dto.TipoDocumentoResponse;
import com.regalia.backend.tipodocumento.infrastructure.entity.TipoDocumentoEntity;
import com.regalia.backend.tipodocumento.infrastructure.mapper.TipoDocumentoMapper;
import com.regalia.backend.tipodocumento.infrastructure.repository.TipoDocumentoJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Servicio de aplicación para gestionar tipos de documento.
 */
@Service
@RequiredArgsConstructor
public class TipoDocumentoService {

    private final TipoDocumentoJpaRepository tipoDocumentoRepository;
    private final TipoDocumentoMapper tipoDocumentoMapper;

    @Transactional(readOnly = true)
    public List<TipoDocumentoResponse> listarActivos() {
        return tipoDocumentoRepository.findByEstadoTrueOrderByIdTipoDocumentoAsc()
                .stream()
                .map(tipoDocumentoMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TipoDocumentoResponse buscarPorId(Long id) {
        TipoDocumentoEntity tipoDocumento = obtenerEntidadActivaPorId(id);

        return tipoDocumentoMapper.toResponse(tipoDocumento);
    }

    @Transactional
    public TipoDocumentoResponse crear(TipoDocumentoRequest request) {
        validarLongitudes(request.longitudMinima(), request.longitudMaxima());
        validarDuplicadosAlCrear(request);

        TipoDocumentoEntity tipoDocumento = tipoDocumentoMapper.toEntity(request);
        TipoDocumentoEntity tipoDocumentoGuardado = tipoDocumentoRepository.save(tipoDocumento);

        return tipoDocumentoMapper.toResponse(tipoDocumentoGuardado);
    }

    @Transactional
    public TipoDocumentoResponse actualizar(Long id, TipoDocumentoRequest request) {
        TipoDocumentoEntity tipoDocumento = obtenerEntidadActivaPorId(id);

        validarLongitudes(request.longitudMinima(), request.longitudMaxima());
        validarDuplicadosAlActualizar(id, request);

        tipoDocumentoMapper.updateEntity(tipoDocumento, request);
        tipoDocumento.setFechaActualizacion(LocalDateTime.now());

        TipoDocumentoEntity tipoDocumentoActualizado = tipoDocumentoRepository.save(tipoDocumento);

        return tipoDocumentoMapper.toResponse(tipoDocumentoActualizado);
    }

    @Transactional
    public void desactivar(Long id) {
        TipoDocumentoEntity tipoDocumento = obtenerEntidadActivaPorId(id);

        tipoDocumento.setEstado(false);
        tipoDocumento.setFechaActualizacion(LocalDateTime.now());

        tipoDocumentoRepository.save(tipoDocumento);
    }

    @Transactional
    public TipoDocumentoResponse reactivar(Long id) {
        TipoDocumentoEntity tipoDocumento = tipoDocumentoRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró el tipo de documento con ID: " + id));

        if (!tipoDocumento.getEstado()) {
            tipoDocumento.setEstado(true);
            tipoDocumento.setFechaActualizacion(LocalDateTime.now());
            tipoDocumentoRepository.save(tipoDocumento);
        }

        return tipoDocumentoMapper.toResponse(tipoDocumento);
    }

    private TipoDocumentoEntity obtenerEntidadActivaPorId(Long id) {
        return tipoDocumentoRepository.findById(id)
                .filter(TipoDocumentoEntity::getEstado)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró el tipo de documento con ID: " + id));
    }

    private void validarLongitudes(Integer longitudMinima, Integer longitudMaxima) {
        if (longitudMinima > longitudMaxima) {
            throw new ReglaNegocioException("La longitud mínima no puede ser mayor que la longitud máxima");
        }
    }

    private void validarDuplicadosAlCrear(TipoDocumentoRequest request) {
        if (tipoDocumentoRepository.existsByNombreIgnoreCase(request.nombre().trim())) {
            throw new RecursoDuplicadoException("Ya existe un tipo de documento con ese nombre");
        }

        if (tipoDocumentoRepository.existsByAbreviaturaIgnoreCase(request.abreviatura().trim())) {
            throw new RecursoDuplicadoException("Ya existe un tipo de documento con esa abreviatura");
        }
    }

    private void validarDuplicadosAlActualizar(Long id, TipoDocumentoRequest request) {
        if (tipoDocumentoRepository.existsByNombreIgnoreCaseAndIdTipoDocumentoNot(request.nombre().trim(), id)) {
            throw new RecursoDuplicadoException("Ya existe otro tipo de documento con ese nombre");
        }

        if (tipoDocumentoRepository.existsByAbreviaturaIgnoreCaseAndIdTipoDocumentoNot(request.abreviatura().trim(), id)) {
            throw new RecursoDuplicadoException("Ya existe otro tipo de documento con esa abreviatura");
        }
    }
}