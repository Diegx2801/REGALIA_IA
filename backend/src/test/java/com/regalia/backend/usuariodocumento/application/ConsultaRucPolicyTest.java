package com.regalia.backend.usuariodocumento.application;

import com.regalia.backend.shared.exception.LimiteSolicitudSeguridadException;
import com.regalia.backend.shared.security.limite.LimiteSeguridadExcedidoException;
import com.regalia.backend.shared.security.limite.LimiteSeguridadSolicitudService;
import com.regalia.backend.shared.security.limite.PoliticaLimiteSeguridad;
import com.regalia.backend.shared.security.limite.ReglaLimiteSeguridad;
import com.regalia.backend.shared.security.limite.TipoSujetoLimiteSeguridad;
import com.regalia.backend.usuariodocumento.infrastructure.client.ApisPeruRucProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class ConsultaRucPolicyTest {

    @Mock
    private LimiteSeguridadSolicitudService limiteSeguridadSolicitudService;

    private ApisPeruRucProperties properties;
    private ConsultaRucPolicy consultaRucPolicy;

    @BeforeEach
    void setUp() {
        properties = new ApisPeruRucProperties();
        properties.setQuotaMaxRequests(2000);
        properties.setQuotaWindow(Duration.ofDays(30));
        properties.setQuotaCooldown(Duration.ZERO);
        consultaRucPolicy = new ConsultaRucPolicy(limiteSeguridadSolicitudService, properties);
    }

    @Test
    void registraConsultaConCuotaGlobalDelProveedor() {
        consultaRucPolicy.registrarConsultaPermitida();

        verify(limiteSeguridadSolicitudService).registrarSolicitudPermitida(
                eq(PoliticaLimiteSeguridad.CONSULTA_RUC),
                eq(TipoSujetoLimiteSeguridad.GLOBAL),
                eq("APISPERU_RUC"),
                argThat(regla -> regla.maximoSolicitudes() == 2000
                        && regla.duracionVentana().equals(Duration.ofDays(30))
                        && regla.cooldown().isZero())
        );
    }

    @Test
    void traduceCuotaAgotadaAErrorDeSolicitudLimitada() {
        doThrow(new LimiteSeguridadExcedidoException(
                com.regalia.backend.shared.security.limite.TipoExcesoLimiteSeguridad.CUOTA
        )).when(limiteSeguridadSolicitudService).registrarSolicitudPermitida(
                eq(PoliticaLimiteSeguridad.CONSULTA_RUC),
                eq(TipoSujetoLimiteSeguridad.GLOBAL),
                eq("APISPERU_RUC"),
                argThat(regla -> true)
        );

        assertThatThrownBy(() -> consultaRucPolicy.registrarConsultaPermitida())
                .isInstanceOf(LimiteSolicitudSeguridadException.class)
                .hasMessageContaining("cuota");
    }
}
