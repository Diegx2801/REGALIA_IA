package com.regalia.backend.tipoentrega.application;

import com.regalia.backend.shared.exception.RecursoDuplicadoException;
import com.regalia.backend.shared.exception.RecursoNoEncontradoException;
import com.regalia.backend.tipoentrega.api.dto.TipoEntregaRequest;
import com.regalia.backend.tipoentrega.api.dto.TipoEntregaResponse;
import com.regalia.backend.tipoentrega.infrastructure.entity.TipoEntregaEntity;
import com.regalia.backend.tipoentrega.infrastructure.mapper.TipoEntregaMapper;
import com.regalia.backend.tipoentrega.infrastructure.repository.TipoEntregaJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Servicio de aplicación para gestionar tipos de entrega.
 */
@Service
@RequiredArgsConstructor
public class TipoEntregaService {

    private final TipoEntregaJpaRepository tipoEntregaJpaRepository;
    private final TipoEntregaMapper tipoEntregaMapper;

    @Transactional(readOnly = true)
    public List<TipoEntregaResponse> listarTiposEntregaActivos() {
        return tipoEntregaJpaRepository.findByEstadoTrueOrderByNombreAsc()
                .stream()
                .map(tipoEntregaMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TipoEntregaResponse obtenerTipoEntregaPorId(Long idTipoEntrega) {
        TipoEntregaEntity tipoEntrega = obtenerTipoEntregaActivo(idTipoEntrega);

        return tipoEntregaMapper.toResponse(tipoEntrega);
    }

    @Transactional
    public TipoEntregaResponse crearTipoEntrega(TipoEntregaRequest request) {
        String nombreNormalizado = normalizarTexto(request.nombre());

        validarNombreDisponibleParaCrear(nombreNormalizado);

        TipoEntregaEntity tipoEntrega = tipoEntregaMapper.toEntity(request);

        TipoEntregaEntity tipoEntregaGuardado = tipoEntregaJpaRepository.save(tipoEntrega);

        return tipoEntregaMapper.toResponse(tipoEntregaGuardado);
    }

    @Transactional
    public TipoEntregaResponse actualizarTipoEntrega(Long idTipoEntrega, TipoEntregaRequest request) {
        TipoEntregaEntity tipoEntrega = obtenerTipoEntregaActivo(idTipoEntrega);

        String nombreNormalizado = normalizarTexto(request.nombre());

        validarNombreDisponibleParaActualizar(nombreNormalizado, idTipoEntrega);

        tipoEntregaMapper.actualizarEntity(tipoEntrega, request);

        TipoEntregaEntity tipoEntregaActualizado = tipoEntregaJpaRepository.saveAndFlush(tipoEntrega);

        return tipoEntregaMapper.toResponse(tipoEntregaActualizado);
    }

    @Transactional
    public void desactivarTipoEntrega(Long idTipoEntrega) {
        TipoEntregaEntity tipoEntrega = obtenerTipoEntregaActivo(idTipoEntrega);

        tipoEntrega.setEstado(false);

        tipoEntregaJpaRepository.save(tipoEntrega);
    }

    @Transactional
    public TipoEntregaResponse reactivarTipoEntrega(Long idTipoEntrega) {
        TipoEntregaEntity tipoEntrega = tipoEntregaJpaRepository.findByIdTipoEntregaAndEstadoFalse(idTipoEntrega)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "No se encontró el tipo de entrega inactivo solicitado"
                ));

        tipoEntrega.setEstado(true);

        TipoEntregaEntity tipoEntregaReactivado = tipoEntregaJpaRepository.saveAndFlush(tipoEntrega);

        return tipoEntregaMapper.toResponse(tipoEntregaReactivado);
    }

    private TipoEntregaEntity obtenerTipoEntregaActivo(Long idTipoEntrega) {
        return tipoEntregaJpaRepository.findByIdTipoEntregaAndEstadoTrue(idTipoEntrega)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "No se encontró el tipo de entrega solicitado"
                ));
    }

    private void validarNombreDisponibleParaCrear(String nombre) {
        if (tipoEntregaJpaRepository.existsByNombreIgnoreCase(nombre)) {
            throw new RecursoDuplicadoException(
                    "Ya existe un tipo de entrega con ese nombre"
            );
        }
    }

    private void validarNombreDisponibleParaActualizar(String nombre, Long idTipoEntrega) {
        if (tipoEntregaJpaRepository.existsByNombreIgnoreCaseAndIdTipoEntregaNot(nombre, idTipoEntrega)) {
            throw new RecursoDuplicadoException(
                    "Ya existe otro tipo de entrega con ese nombre"
            );
        }
    }

    private String normalizarTexto(String texto) {
        return texto.trim();
    }
}