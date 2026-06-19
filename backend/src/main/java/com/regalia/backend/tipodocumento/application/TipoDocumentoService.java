package com.regalia.backend.tipodocumento.application;

import com.regalia.backend.categoriadocumento.infrastructure.entity.CategoriaDocumentoEntity;
import com.regalia.backend.categoriadocumento.infrastructure.repository.CategoriaDocumentoJpaRepository;
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

import java.util.List;

/**
 * Servicio de aplicación para gestionar tipos de documento.
 */
@Service
@RequiredArgsConstructor
public class TipoDocumentoService {

    private final TipoDocumentoJpaRepository tipoDocumentoRepository;
    private final CategoriaDocumentoJpaRepository categoriaDocumentoRepository;
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

        CategoriaDocumentoEntity categoriaDocumento = obtenerCategoriaDocumentoActivaPorId(request.idCategoriaDocumento());

        TipoDocumentoEntity tipoDocumento = tipoDocumentoMapper.toEntity(request, categoriaDocumento);
        TipoDocumentoEntity tipoDocumentoGuardado = tipoDocumentoRepository.save(tipoDocumento);

        return tipoDocumentoMapper.toResponse(tipoDocumentoGuardado);
    }

    @Transactional
    public TipoDocumentoResponse actualizar(Long id, TipoDocumentoRequest request) {
        TipoDocumentoEntity tipoDocumento = obtenerEntidadActivaPorId(id);

        validarLongitudes(request.longitudMinima(), request.longitudMaxima());
        validarDuplicadosAlActualizar(id, request);

        CategoriaDocumentoEntity categoriaDocumento = obtenerCategoriaDocumentoActivaPorId(request.idCategoriaDocumento());

        tipoDocumentoMapper.updateEntity(tipoDocumento, request, categoriaDocumento);

        TipoDocumentoEntity tipoDocumentoActualizado = tipoDocumentoRepository.saveAndFlush(tipoDocumento);

        return tipoDocumentoMapper.toResponse(tipoDocumentoActualizado);
    }

    @Transactional
    public void desactivar(Long id) {
        TipoDocumentoEntity tipoDocumento = obtenerEntidadActivaPorId(id);

        tipoDocumento.setEstado(false);

        tipoDocumentoRepository.save(tipoDocumento);
    }

    @Transactional
    public TipoDocumentoResponse reactivar(Long id) {
        TipoDocumentoEntity tipoDocumento = tipoDocumentoRepository.findByIdTipoDocumentoAndEstadoFalse(id)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "No se encontró el tipo de documento inactivo solicitado"
                ));

        tipoDocumento.setEstado(true);

        TipoDocumentoEntity tipoDocumentoReactivado = tipoDocumentoRepository.saveAndFlush(tipoDocumento);

        return tipoDocumentoMapper.toResponse(tipoDocumentoReactivado);
    }

    private TipoDocumentoEntity obtenerEntidadActivaPorId(Long id) {
        return tipoDocumentoRepository.findByIdTipoDocumentoAndEstadoTrue(id)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "No se encontró el tipo de documento solicitado"
                ));
    }

    private CategoriaDocumentoEntity obtenerCategoriaDocumentoActivaPorId(Long idCategoriaDocumento) {
        return categoriaDocumentoRepository.findById(idCategoriaDocumento)
                .filter(CategoriaDocumentoEntity::getEstado)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "No se encontró la categoría de documento con ID: " + idCategoriaDocumento
                ));
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