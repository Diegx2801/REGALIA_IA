package com.regalia.backend.politicacomercial.application;

import com.regalia.backend.politicacomercial.infrastructure.entity.PoliticaComercialEntity;
import com.regalia.backend.politicacomercial.infrastructure.repository.PoliticaComercialJpaRepository;
import com.regalia.backend.shared.exception.ReglaNegocioException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class PoliticaComercialService {

    private static final String CODIGO_PORCENTAJE_SENA = "PORCENTAJE_SENA";
    private static final String CODIGO_PORCENTAJE_COMISION = "PORCENTAJE_COMISION";

    private static final String UNIDAD_PORCENTAJE = "PORCENTAJE";

    private static final BigDecimal CIEN = new BigDecimal("100.00");

    private final PoliticaComercialJpaRepository politicaComercialRepository;

    @Transactional(readOnly = true)
    public BigDecimal obtenerPorcentajeSena() {
        return obtenerPorcentajeActivoPorCodigo(CODIGO_PORCENTAJE_SENA);
    }

    @Transactional(readOnly = true)
    public BigDecimal obtenerPorcentajeComision() {
        return obtenerPorcentajeActivoPorCodigo(CODIGO_PORCENTAJE_COMISION);
    }

    private BigDecimal obtenerPorcentajeActivoPorCodigo(String codigo) {
        PoliticaComercialEntity politica = politicaComercialRepository
                .findByCodigoAndEstadoTrue(codigo)
                .orElseThrow(() -> new ReglaNegocioException(
                        "No existe una política comercial activa para el código: " + codigo
                ));

        validarPoliticaPorcentaje(politica);

        return politica.getValor();
    }

    private void validarPoliticaPorcentaje(PoliticaComercialEntity politica) {
        if (politica.getUnidad() == null || !UNIDAD_PORCENTAJE.equals(politica.getUnidad())) {
            throw new ReglaNegocioException(
                    "La política comercial " + politica.getCodigo()
                            + " debe tener unidad PORCENTAJE"
            );
        }

        if (politica.getValor() == null) {
            throw new ReglaNegocioException(
                    "La política comercial " + politica.getCodigo()
                            + " debe tener un valor configurado"
            );
        }

        if (politica.getValor().compareTo(BigDecimal.ZERO) < 0
                || politica.getValor().compareTo(CIEN) > 0) {
            throw new ReglaNegocioException(
                    "La política comercial " + politica.getCodigo()
                            + " debe tener un valor entre 0 y 100"
            );
        }
    }
}