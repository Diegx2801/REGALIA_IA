package com.regalia.backend.tipoproducto.application;

import com.regalia.backend.shared.exception.RecursoNoEncontradoException;
import com.regalia.backend.tipoproducto.api.dto.TipoProductoResponse;
import com.regalia.backend.tipoproducto.infrastructure.entity.TipoProductoEntity;
import com.regalia.backend.tipoproducto.infrastructure.mapper.TipoProductoMapper;
import com.regalia.backend.tipoproducto.infrastructure.repository.TipoProductoJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Servicio de consulta para los tipos de producto configurados por despliegue.
 */
@Service
@RequiredArgsConstructor
public class TipoProductoService {

    private final TipoProductoJpaRepository tipoProductoJpaRepository;
    private final TipoProductoMapper tipoProductoMapper;

    @Transactional(readOnly = true)
    public List<TipoProductoResponse> listarTiposProductoActivos() {
        return tipoProductoJpaRepository.findByEstadoTrueOrderByNombreAsc().stream()
                .map(tipoProductoMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TipoProductoResponse> listarTiposProductoAdministracion() {
        return tipoProductoJpaRepository.findAllByOrderByNombreAsc().stream()
                .map(tipoProductoMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TipoProductoResponse obtenerTipoProductoPorId(Long idTipoProducto) {
        return tipoProductoMapper.toResponse(obtenerTipoProductoActivo(idTipoProducto));
    }

    @Transactional(readOnly = true)
    public TipoProductoResponse obtenerTipoProductoAdministracionPorId(Long idTipoProducto) {
        TipoProductoEntity tipoProducto = tipoProductoJpaRepository.findById(idTipoProducto)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontro el tipo de producto solicitado"));

        return tipoProductoMapper.toResponse(tipoProducto);
    }

    private TipoProductoEntity obtenerTipoProductoActivo(Long idTipoProducto) {
        return tipoProductoJpaRepository.findByIdTipoProductoAndEstadoTrue(idTipoProducto)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontro el tipo de producto solicitado"));
    }
}
