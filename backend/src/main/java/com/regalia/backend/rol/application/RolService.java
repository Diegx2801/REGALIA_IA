package com.regalia.backend.rol.application;

import com.regalia.backend.rol.api.dto.RolResponse;
import com.regalia.backend.rol.infrastructure.entity.RolEntity;
import com.regalia.backend.rol.infrastructure.mapper.RolMapper;
import com.regalia.backend.rol.infrastructure.repository.RolJpaRepository;
import com.regalia.backend.shared.exception.RecursoNoEncontradoException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Servicio de aplicación para consultar roles del sistema.
 */
@Service
@RequiredArgsConstructor
public class RolService {

    private final RolJpaRepository rolRepository;
    private final RolMapper rolMapper;

    @Transactional(readOnly = true)
    public List<RolResponse> listarActivos() {
        return rolRepository.findByEstadoTrueOrderByIdRolAsc()
                .stream()
                .map(rolMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public RolResponse buscarPorId(Long id) {
        RolEntity rol = obtenerEntidadPorId(id);

        return rolMapper.toResponse(rol);
    }

    @Transactional(readOnly = true)
    public RolEntity obtenerEntidadActivaPorNombre(String nombre) {
        return rolRepository.findByNombreIgnoreCaseAndEstadoTrue(nombre)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró el rol: " + nombre));
    }

    private RolEntity obtenerEntidadPorId(Long id) {
        return rolRepository.findById(id)
                .filter(RolEntity::getEstado)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró el rol con ID: " + id));
    }
}