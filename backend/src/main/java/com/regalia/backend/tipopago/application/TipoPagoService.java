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
 * Servicio de aplicación para consultar y administrar datos visibles
 * de tipos de pago.
 *
 * Los codigos de tipo de pago son controlados por migraciones porque
 * afectan lógica interna del flujo de pedidos.
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
    public List<TipoPagoResponse> listarTiposPagoAdministracion() {
        return tipoPagoRepository.findAllByOrderByIdTipoPagoAsc()
                .stream()
                .map(tipoPagoMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TipoPagoResponse buscarPorId(Long id) {
        TipoPagoEntity tipoPago = obtenerEntidadActivaPorId(id);

        return tipoPagoMapper.toResponse(tipoPago);
    }

    @Transactional(readOnly = true)
    public TipoPagoResponse buscarTipoPagoAdministracionPorId(Long id) {
        TipoPagoEntity tipoPago = tipoPagoRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "No se encontró el tipo de pago solicitado"
                ));

        return tipoPagoMapper.toResponse(tipoPago);
    }

    @Transactional
    public TipoPagoResponse actualizarDatosVisibles(Long id, TipoPagoRequest request) {
        TipoPagoEntity tipoPago = obtenerEntidadActivaPorId(id);

        String nombreNormalizado = request.nombre().trim();

        validarNombreDisponibleParaActualizar(nombreNormalizado, id);

        tipoPagoMapper.updateEntity(tipoPago, request);

        TipoPagoEntity tipoPagoActualizado = tipoPagoRepository.saveAndFlush(tipoPago);

        return tipoPagoMapper.toResponse(tipoPagoActualizado);
    }

    private TipoPagoEntity obtenerEntidadActivaPorId(Long id) {
        return tipoPagoRepository.findByIdTipoPagoAndEstadoTrue(id)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "No se encontró el tipo de pago solicitado"
                ));
    }

    private void validarNombreDisponibleParaActualizar(String nombre, Long idTipoPago) {
        if (tipoPagoRepository.existsByNombreIgnoreCaseAndIdTipoPagoNot(nombre, idTipoPago)) {
            throw new RecursoDuplicadoException(
                    "Ya existe otro tipo de pago con ese nombre"
            );
        }
    }
}
