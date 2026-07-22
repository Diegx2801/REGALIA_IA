package com.regalia.backend.usuariodocumento.application;

import com.regalia.backend.usuariodocumento.api.dto.ConsultaRucResponse;
import com.regalia.backend.shared.exception.LimiteSolicitudSeguridadException;
import com.regalia.backend.usuariodocumento.infrastructure.client.ApisPeruRucClient;
import com.regalia.backend.usuariodocumento.infrastructure.client.ApisPeruRucProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Duration;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ConsultaRucServiceTest {

    private static final String RUC = "20123456789";

    @Mock
    private ApisPeruRucClient apisPeruRucClient;

    @Mock
    private ConsultaRucPolicy consultaRucPolicy;

    private ApisPeruRucProperties properties;
    private ConsultaRucService consultaRucService;

    @BeforeEach
    void setUp() {
        properties = new ApisPeruRucProperties();
        properties.setCacheTtl(Duration.ofHours(1));
        properties.setCacheMaxEntries(10);
        consultaRucService = new ConsultaRucService(apisPeruRucClient, consultaRucPolicy, properties);
    }

    @Test
    void reutilizaRespuestaCacheadaYNoConsumeCuotaNuevamente() {
        ConsultaRucResponse respuesta = respuestaRuc();
        when(apisPeruRucClient.consultar(RUC)).thenReturn(respuesta);

        assertThat(consultaRucService.consultar(RUC)).isSameAs(respuesta);
        assertThat(consultaRucService.consultar(RUC)).isSameAs(respuesta);

        verify(consultaRucPolicy).registrarConsultaPermitida();
        verify(apisPeruRucClient).consultar(RUC);
        verifyNoMoreInteractions(consultaRucPolicy, apisPeruRucClient);
    }

    @Test
    void vuelveAConsultarCuandoElCacheExpira() {
        properties.setCacheTtl(Duration.ZERO);
        consultaRucService = new ConsultaRucService(apisPeruRucClient, consultaRucPolicy, properties);
        ConsultaRucResponse respuesta = respuestaRuc();
        when(apisPeruRucClient.consultar(RUC)).thenReturn(respuesta);

        consultaRucService.consultar(RUC);
        consultaRucService.consultar(RUC);

        verify(consultaRucPolicy, org.mockito.Mockito.times(2)).registrarConsultaPermitida();
        verify(apisPeruRucClient, org.mockito.Mockito.times(2)).consultar(RUC);
    }

    @Test
    void deduplicaConsultasConcurrentesDelMismoRuc() throws Exception {
        CountDownLatch proveedorIniciado = new CountDownLatch(1);
        CountDownLatch liberarProveedor = new CountDownLatch(1);
        ConsultaRucResponse respuesta = respuestaRuc();
        when(apisPeruRucClient.consultar(RUC)).thenAnswer(invocacion -> {
            proveedorIniciado.countDown();
            assertThat(liberarProveedor.await(2, TimeUnit.SECONDS)).isTrue();
            return respuesta;
        });

        ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            Future<ConsultaRucResponse> primera = executor.submit(() -> consultaRucService.consultar(RUC));
            assertThat(proveedorIniciado.await(2, TimeUnit.SECONDS)).isTrue();
            Future<ConsultaRucResponse> segunda = executor.submit(() -> consultaRucService.consultar(RUC));

            liberarProveedor.countDown();

            assertThat(primera.get(2, TimeUnit.SECONDS)).isSameAs(respuesta);
            assertThat(segunda.get(2, TimeUnit.SECONDS)).isSameAs(respuesta);
        } finally {
            executor.shutdownNow();
        }

        verify(consultaRucPolicy).registrarConsultaPermitida();
        verify(apisPeruRucClient).consultar(RUC);
    }

    @Test
    void noInvocaElProveedorCuandoLaCuotaEstaAgotada() {
        doThrow(new LimiteSolicitudSeguridadException("Cuota agotada"))
                .when(consultaRucPolicy)
                .registrarConsultaPermitida();

        assertThatThrownBy(() -> consultaRucService.consultar(RUC))
                .isInstanceOf(LimiteSolicitudSeguridadException.class);

        verifyNoInteractions(apisPeruRucClient);
    }

    private ConsultaRucResponse respuestaRuc() {
        return new ConsultaRucResponse(
                RUC,
                "REGALIA DEMO SAC",
                "REGALIA",
                "ACTIVO",
                "HABIDO",
                "Av. Principal 123",
                "LA LIBERTAD",
                "TRUJILLO",
                "TRUJILLO"
        );
    }
}
