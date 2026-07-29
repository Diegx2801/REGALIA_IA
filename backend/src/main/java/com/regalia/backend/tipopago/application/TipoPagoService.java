package com.regalia.backend.tipopago.application;

import com.regalia.backend.shared.exception.RecursoNoEncontradoException;
import com.regalia.backend.tipopago.api.dto.TipoPagoResponse;
import com.regalia.backend.tipopago.infrastructure.entity.TipoPagoEntity;
import com.regalia.backend.tipopago.infrastructure.mapper.TipoPagoMapper;
import com.regalia.backend.tipopago.infrastructure.repository.TipoPagoJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Servicio de consulta para los tipos de pago controlados por despliegue.
 */
@Service
@RequiredArgsConstructor
public class TipoPagoService {

    private final TipoPagoJpaRepository tipoPagoRepository;
    private final TipoPagoMapper tipoPagoMapper;

    @Transactional(readOnly = true)
    public List<TipoPagoResponse> listarActivos() {
        return tipoPagoRepository.findByEstadoTrueOrderByIdTipoPagoAsc().stream()
                .map(tipoPagoMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TipoPagoResponse> listarTiposPagoAdministracion() {
        return tipoPagoRepository.findAllByOrderByIdTipoPagoAsc().stream()
                .map(tipoPagoMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TipoPagoResponse buscarPorId(Long id) {
        return tipoPagoMapper.toResponse(obtenerEntidadActivaPorId(id));
    }

    @Transactional(readOnly = true)
    public TipoPagoResponse buscarTipoPagoAdministracionPorId(Long id) {
        TipoPagoEntity tipoPago = tipoPagoRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontro el tipo de pago solicitado"));

        return tipoPagoMapper.toResponse(tipoPago);
    }

    private TipoPagoEntity obtenerEntidadActivaPorId(Long id) {
        return tipoPagoRepository.findByIdTipoPagoAndEstadoTrue(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontro el tipo de pago solicitado"));
    }
}
