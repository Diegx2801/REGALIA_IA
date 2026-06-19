package com.regalia.backend.rubro.application;

import com.regalia.backend.rubro.api.dto.RubroRequest;
import com.regalia.backend.rubro.api.dto.RubroResponse;
import com.regalia.backend.rubro.infrastructure.entity.RubroEntity;
import com.regalia.backend.rubro.infrastructure.mapper.RubroMapper;
import com.regalia.backend.rubro.infrastructure.repository.RubroJpaRepository;
import com.regalia.backend.shared.exception.RecursoDuplicadoException;
import com.regalia.backend.shared.exception.RecursoNoEncontradoException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Servicio de aplicación para gestionar rubros comerciales de tiendas.
 */
@Service
@RequiredArgsConstructor
public class RubroService {

    private final RubroJpaRepository rubroRepository;
    private final RubroMapper rubroMapper;

    @Transactional(readOnly = true)
    public List<RubroResponse> listarRubrosActivos() {
        return rubroRepository.findByEstadoTrueOrderByIdRubroAsc()
                .stream()
                .map(rubroMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public RubroResponse obtenerRubroActivoPorId(Long idRubro) {
        RubroEntity rubro = obtenerEntidadActivaPorId(idRubro);

        return rubroMapper.toResponse(rubro);
    }

    @Transactional
    public RubroResponse crearRubro(RubroRequest request) {
        String nombreNormalizado = rubroMapper.normalizarNombre(request.nombre());

        validarNombreDisponible(nombreNormalizado);

        RubroEntity rubro = rubroMapper.toEntity(request);
        RubroEntity rubroGuardado = rubroRepository.save(rubro);

        return rubroMapper.toResponse(rubroGuardado);
    }

    @Transactional
    public RubroResponse actualizarRubro(Long idRubro, RubroRequest request) {
        RubroEntity rubro = obtenerEntidadActivaPorId(idRubro);

        String nombreNormalizado = rubroMapper.normalizarNombre(request.nombre());

        validarNombreDisponibleParaActualizar(nombreNormalizado, idRubro);

        rubroMapper.actualizarEntity(rubro, request);

        RubroEntity rubroActualizado = rubroRepository.saveAndFlush(rubro);

        return rubroMapper.toResponse(rubroActualizado);
    }

    @Transactional
    public void desactivarRubro(Long idRubro) {
        RubroEntity rubro = obtenerEntidadActivaPorId(idRubro);

        rubro.setEstado(false);

        rubroRepository.save(rubro);
    }

    @Transactional
    public RubroResponse reactivarRubro(Long idRubro) {
        RubroEntity rubro = rubroRepository.findByIdRubroAndEstadoFalse(idRubro)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "No se encontró el rubro inactivo solicitado"
                ));

        rubro.setEstado(true);

        RubroEntity rubroReactivado = rubroRepository.saveAndFlush(rubro);

        return rubroMapper.toResponse(rubroReactivado);
    }

    private RubroEntity obtenerEntidadActivaPorId(Long idRubro) {
        return rubroRepository.findByIdRubroAndEstadoTrue(idRubro)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "No se encontró el rubro solicitado"
                ));
    }

    private void validarNombreDisponible(String nombreNormalizado) {
        if (rubroRepository.existsByNombreIgnoreCase(nombreNormalizado)) {
            throw new RecursoDuplicadoException("Ya existe un rubro con ese nombre");
        }
    }

    private void validarNombreDisponibleParaActualizar(String nombreNormalizado, Long idRubro) {
        if (rubroRepository.existsByNombreIgnoreCaseAndIdRubroNot(nombreNormalizado, idRubro)) {
            throw new RecursoDuplicadoException("Ya existe otro rubro con ese nombre");
        }
    }
}