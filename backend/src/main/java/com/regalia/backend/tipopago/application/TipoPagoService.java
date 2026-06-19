package com.regalia.backend.tipopago.application;

import com.regalia.backend.shared.exception.RecursoDuplicadoException;
import com.regalia.backend.shared.exception.RecursoNoEncontradoException;
import com.regalia.backend.tipopago.api.dto.TipoPagoRequest;
import com.regalia.backend.tipopago.api.dto.TipoPagoResponse;
import com.regalia.backend.tipopago.infrastructure.entity.TipoPagoEntity;
import com.regalia.backend.tipopago.infrastructure.mapper.TipoPagoMapper;
import com.regalia.backend.tipopago.infrastructure.repository.TipoPagoJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Servicio de aplicación para gestionar tipos de pago.
 */
@Service
@RequiredArgsConstructor
public class TipoPagoService {

    private final TipoPagoJpaRepository tipoPagoRepository;
    private final TipoPagoMapper tipoPagoMapper;

    @Transactional(readOnly = true)
    public List<TipoPagoResponse> listarActivos() {
        return tipoPagoRepository.findByEstadoTrueOrderByIdTipoPagoAsc()
                .stream()
                .map(tipoPagoMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TipoPagoResponse buscarPorId(Long id) {
        TipoPagoEntity tipoPago = obtenerEntidadActivaPorId(id);

        return tipoPagoMapper.toResponse(tipoPago);
    }

    @Transactional
    public TipoPagoResponse crear(TipoPagoRequest request) {
        String nombreNormalizado = request.nombre().trim();

        validarNombreDisponibleParaCrear(nombreNormalizado);

        TipoPagoEntity tipoPago = tipoPagoMapper.toEntity(request);

        TipoPagoEntity tipoPagoGuardado = tipoPagoRepository.save(tipoPago);

        return tipoPagoMapper.toResponse(tipoPagoGuardado);
    }

    @Transactional
    public TipoPagoResponse actualizar(Long id, TipoPagoRequest request) {
        TipoPagoEntity tipoPago = obtenerEntidadActivaPorId(id);

        String nombreNormalizado = request.nombre().trim();

        validarNombreDisponibleParaActualizar(nombreNormalizado, id);

        tipoPagoMapper.updateEntity(tipoPago, request);

        TipoPagoEntity tipoPagoActualizado = tipoPagoRepository.saveAndFlush(tipoPago);

        return tipoPagoMapper.toResponse(tipoPagoActualizado);
    }

    @Transactional
    public void desactivar(Long id) {
        TipoPagoEntity tipoPago = obtenerEntidadActivaPorId(id);

        tipoPago.setEstado(false);

        tipoPagoRepository.save(tipoPago);
    }

    @Transactional
    public TipoPagoResponse reactivar(Long id) {
        TipoPagoEntity tipoPago = tipoPagoRepository.findByIdTipoPagoAndEstadoFalse(id)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "No se encontró el tipo de pago inactivo solicitado"
                ));

        tipoPago.setEstado(true);

        TipoPagoEntity tipoPagoReactivado = tipoPagoRepository.saveAndFlush(tipoPago);

        return tipoPagoMapper.toResponse(tipoPagoReactivado);
    }

    private TipoPagoEntity obtenerEntidadActivaPorId(Long id) {
        return tipoPagoRepository.findByIdTipoPagoAndEstadoTrue(id)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "No se encontró el tipo de pago solicitado"
                ));
    }

    private void validarNombreDisponibleParaCrear(String nombre) {
        if (tipoPagoRepository.existsByNombreIgnoreCase(nombre)) {
            throw new RecursoDuplicadoException(
                    "Ya existe un tipo de pago con ese nombre"
            );
        }
    }

    private void validarNombreDisponibleParaActualizar(String nombre, Long idTipoPago) {
        if (tipoPagoRepository.existsByNombreIgnoreCaseAndIdTipoPagoNot(nombre, idTipoPago)) {
            throw new RecursoDuplicadoException(
                    "Ya existe otro tipo de pago con ese nombre"
            );
        }
    }
}