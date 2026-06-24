package com.regalia.backend.tipoproducto.application;

import com.regalia.backend.shared.exception.RecursoDuplicadoException;
import com.regalia.backend.shared.exception.RecursoNoEncontradoException;
import com.regalia.backend.tipoproducto.api.dto.TipoProductoRequest;
import com.regalia.backend.tipoproducto.api.dto.TipoProductoResponse;
import com.regalia.backend.tipoproducto.infrastructure.entity.TipoProductoEntity;
import com.regalia.backend.tipoproducto.infrastructure.mapper.TipoProductoMapper;
import com.regalia.backend.tipoproducto.infrastructure.repository.TipoProductoJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Servicio de aplicación para gestionar tipos de producto.
 */
@Service
@RequiredArgsConstructor
public class TipoProductoService {

    private final TipoProductoJpaRepository tipoProductoJpaRepository;
    private final TipoProductoMapper tipoProductoMapper;

    @Transactional(readOnly = true)
    public List<TipoProductoResponse> listarTiposProductoActivos() {
        return tipoProductoJpaRepository.findByEstadoTrueOrderByNombreAsc()
                .stream()
                .map(tipoProductoMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TipoProductoResponse> listarTiposProductoAdministracion() {
        return tipoProductoJpaRepository.findAllByOrderByNombreAsc()
                .stream()
                .map(tipoProductoMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TipoProductoResponse obtenerTipoProductoPorId(Long idTipoProducto) {
        TipoProductoEntity tipoProducto = obtenerTipoProductoActivo(idTipoProducto);

        return tipoProductoMapper.toResponse(tipoProducto);
    }

    @Transactional(readOnly = true)
    public TipoProductoResponse obtenerTipoProductoAdministracionPorId(Long idTipoProducto) {
        TipoProductoEntity tipoProducto = tipoProductoJpaRepository.findById(idTipoProducto)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "No se encontró el tipo de producto solicitado"
                ));

        return tipoProductoMapper.toResponse(tipoProducto);
    }

    @Transactional
    public TipoProductoResponse crearTipoProducto(TipoProductoRequest request) {
        String nombreNormalizado = normalizarTexto(request.nombre());

        validarNombreDisponibleParaCrear(nombreNormalizado);

        TipoProductoEntity tipoProducto = tipoProductoMapper.toEntity(request);

        TipoProductoEntity tipoProductoGuardado = tipoProductoJpaRepository.save(tipoProducto);

        return tipoProductoMapper.toResponse(tipoProductoGuardado);
    }

    @Transactional
    public TipoProductoResponse actualizarTipoProducto(Long idTipoProducto, TipoProductoRequest request) {
        TipoProductoEntity tipoProducto = obtenerTipoProductoActivo(idTipoProducto);

        String nombreNormalizado = normalizarTexto(request.nombre());

        validarNombreDisponibleParaActualizar(nombreNormalizado, idTipoProducto);

        tipoProductoMapper.actualizarEntity(tipoProducto, request);

        TipoProductoEntity tipoProductoActualizado = tipoProductoJpaRepository.saveAndFlush(tipoProducto);

        return tipoProductoMapper.toResponse(tipoProductoActualizado);
    }

    @Transactional
    public void desactivarTipoProducto(Long idTipoProducto) {
        TipoProductoEntity tipoProducto = obtenerTipoProductoActivo(idTipoProducto);

        tipoProducto.setEstado(false);

        tipoProductoJpaRepository.save(tipoProducto);
    }

    @Transactional
    public TipoProductoResponse reactivarTipoProducto(Long idTipoProducto) {
        TipoProductoEntity tipoProducto = tipoProductoJpaRepository.findByIdTipoProductoAndEstadoFalse(idTipoProducto)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "No se encontró el tipo de producto inactivo solicitado"
                ));

        tipoProducto.setEstado(true);

        TipoProductoEntity tipoProductoReactivado = tipoProductoJpaRepository.saveAndFlush(tipoProducto);

        return tipoProductoMapper.toResponse(tipoProductoReactivado);
    }

    private TipoProductoEntity obtenerTipoProductoActivo(Long idTipoProducto) {
        return tipoProductoJpaRepository.findByIdTipoProductoAndEstadoTrue(idTipoProducto)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "No se encontró el tipo de producto solicitado"
                ));
    }

    private void validarNombreDisponibleParaCrear(String nombre) {
        if (tipoProductoJpaRepository.existsByNombreIgnoreCase(nombre)) {
            throw new RecursoDuplicadoException(
                    "Ya existe un tipo de producto con ese nombre"
            );
        }
    }

    private void validarNombreDisponibleParaActualizar(String nombre, Long idTipoProducto) {
        if (tipoProductoJpaRepository.existsByNombreIgnoreCaseAndIdTipoProductoNot(nombre, idTipoProducto)) {
            throw new RecursoDuplicadoException(
                    "Ya existe otro tipo de producto con ese nombre"
            );
        }
    }

    private String normalizarTexto(String texto) {
        return texto.trim();
    }
}
