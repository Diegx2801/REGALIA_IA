package com.regalia.backend.rubro.application;

import com.regalia.backend.rubro.api.dto.RubroResponse;
import com.regalia.backend.rubro.infrastructure.entity.RubroEntity;
import com.regalia.backend.rubro.infrastructure.mapper.RubroMapper;
import com.regalia.backend.rubro.infrastructure.repository.RubroJpaRepository;
import com.regalia.backend.shared.exception.RecursoNoEncontradoException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Servicio de consulta para los rubros comerciales configurados por despliegue.
 */
@Service
@RequiredArgsConstructor
public class RubroService {

    private final RubroJpaRepository rubroRepository;
    private final RubroMapper rubroMapper;

    @Transactional(readOnly = true)
    public List<RubroResponse> listarRubrosActivos() {
        return rubroRepository.findByEstadoTrueOrderByIdRubroAsc().stream()
                .map(rubroMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RubroResponse> listarRubrosAdministracion() {
        return rubroRepository.findAllByOrderByIdRubroAsc().stream()
                .map(rubroMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public RubroResponse obtenerRubroActivoPorId(Long idRubro) {
        return rubroMapper.toResponse(obtenerEntidadActivaPorId(idRubro));
    }

    @Transactional(readOnly = true)
    public RubroResponse obtenerRubroAdministracionPorId(Long idRubro) {
        RubroEntity rubro = rubroRepository.findById(idRubro)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontro el rubro solicitado"));

        return rubroMapper.toResponse(rubro);
    }

    private RubroEntity obtenerEntidadActivaPorId(Long idRubro) {
        return rubroRepository.findByIdRubroAndEstadoTrue(idRubro)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontro el rubro solicitado"));
    }
}
