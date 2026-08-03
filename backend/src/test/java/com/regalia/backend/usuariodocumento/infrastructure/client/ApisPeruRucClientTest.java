package com.regalia.backend.usuariodocumento.infrastructure.client;

import com.regalia.backend.usuariodocumento.application.ConsultaRuc;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.DefaultUriBuilderFactory;
import org.springframework.web.util.UriBuilder;

import java.net.URI;
import java.util.function.Function;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ApisPeruRucClientTest {

    private static final String RUC = "20123456789";
    private static final String URL = "https://apis-peru.test/api/v1/ruc";

    @Mock
    private RestClient.Builder restClientBuilder;

    @Mock
    private RestClient restClient;

    @Mock
    private RestClient.RequestHeadersUriSpec<?> requestSpec;

    @Mock
    private RestClient.RequestHeadersSpec<?> requestHeadersSpec;

    @Mock
    private RestClient.ResponseSpec responseSpec;

    private ApisPeruRucProperties properties;
    private ApisPeruRucClient client;

    @BeforeEach
    void setUp() {
        properties = new ApisPeruRucProperties();
        properties.setUrl(URL);
        properties.setToken("token-de-prueba");

        when(restClientBuilder.clone()).thenReturn(restClientBuilder);
        when(restClientBuilder.baseUrl(URL)).thenReturn(restClientBuilder);
        when(restClientBuilder.requestFactory(any(ClientHttpRequestFactory.class))).thenReturn(restClientBuilder);
        when(restClientBuilder.build()).thenReturn(restClient);
        doReturn(requestSpec).when(restClient).get();
        doReturn(requestHeadersSpec).when(requestSpec).uri(any(Function.class));
        doReturn(responseSpec).when(requestHeadersSpec).retrieve();
        when(responseSpec.body(eq(ApisPeruRucClient.ApisPeruRucDto.class)))
                .thenReturn(new ApisPeruRucClient.ApisPeruRucDto(
                        RUC,
                        "REGALIA DEMO SAC",
                        "REGALIA",
                        "ACTIVO",
                        "HABIDO",
                        "Av. Principal 123",
                        "LA LIBERTAD",
                        "TRUJILLO",
                        "TRUJILLO"
                ));

        client = new ApisPeruRucClient(properties, restClientBuilder);
    }

    @Test
    void consultaElProveedorYMapeaLaRespuestaAlModeloInterno() {
        ConsultaRuc resultado = client.consultar(RUC);

        assertThat(resultado).isEqualTo(new ConsultaRuc(
                RUC,
                "REGALIA DEMO SAC",
                "REGALIA",
                "ACTIVO",
                "HABIDO",
                "Av. Principal 123",
                "LA LIBERTAD",
                "TRUJILLO",
                "TRUJILLO"
        ));

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Function<UriBuilder, URI>> uriCaptor = ArgumentCaptor.forClass(Function.class);
        verify(requestSpec).uri(uriCaptor.capture());

        URI uri = uriCaptor.getValue().apply(new DefaultUriBuilderFactory().builder());
        assertThat(uri.toString()).isEqualTo("/" + RUC + "?token=token-de-prueba");
    }
}
