package com.regalia.backend.usuariodocumento.application;

import com.regalia.backend.tipodocumento.infrastructure.entity.TipoDocumentoEntity;
import com.regalia.backend.tipodocumento.infrastructure.repository.TipoDocumentoJpaRepository;
import com.regalia.backend.usuario.infrastructure.entity.UsuarioEntity;
import com.regalia.backend.usuario.infrastructure.repository.UsuarioJpaRepository;
import com.regalia.backend.shared.exception.ReglaNegocioException;
import com.regalia.backend.usuariodocumento.api.dto.ConsultaRucResponse;
import com.regalia.backend.usuariodocumento.api.dto.RegistrarRucRequest;
import com.regalia.backend.usuariodocumento.api.dto.UsuarioDocumentoResponse;
import com.regalia.backend.usuariodocumento.infrastructure.entity.UsuarioDocumentoEntity;
import com.regalia.backend.usuariodocumento.infrastructure.mapper.UsuarioDocumentoMapper;
import com.regalia.backend.usuariodocumento.infrastructure.repository.UsuarioDocumentoJpaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Locale;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UsuarioDocumentoServiceTest {

    private static final String CORREO = "vendedor@regalia.test";
    private static final String RUC = "20123456789";

    @Mock
    private UsuarioDocumentoJpaRepository usuarioDocumentoRepository;

    @Mock
    private UsuarioJpaRepository usuarioRepository;

    @Mock
    private TipoDocumentoJpaRepository tipoDocumentoRepository;

    @Mock
    private UsuarioDocumentoMapper usuarioDocumentoMapper;

    @Mock
    private ConsultaRucService consultaRucService;

    private UsuarioDocumentoService usuarioDocumentoService;

    @BeforeEach
    void setUp() {
        usuarioDocumentoService = new UsuarioDocumentoService(
                usuarioDocumentoRepository,
                usuarioRepository,
                tipoDocumentoRepository,
                usuarioDocumentoMapper,
                consultaRucService
        );
        when(usuarioDocumentoMapper.normalizarDocumento(anyString()))
                .thenAnswer(invocacion -> invocacion.getArgument(0, String.class).trim().toUpperCase(Locale.ROOT));
    }

    @Test
    void normalizaElRucAntesDeConsultarElServicioCentral() {
        ConsultaRucResponse respuesta = respuestaRuc();
        when(consultaRucService.consultar(RUC)).thenReturn(respuesta);

        ConsultaRucResponse resultado = usuarioDocumentoService.consultarRuc(" 20123456789 ");

        assertThat(resultado).isSameAs(respuesta);
        verify(consultaRucService).consultar(RUC);
    }

    @Test
    void rechazaRucInvalidoAntesDeConsultarElServicioCentral() {
        assertThatThrownBy(() -> usuarioDocumentoService.consultarRuc("ABC"))
                .isInstanceOf(ReglaNegocioException.class)
                .hasMessageContaining("11 digitos");

        verifyNoInteractions(consultaRucService);
    }

    @Test
    void reutilizaElServicioCentralAlRegistrarRuc() {
        UsuarioEntity usuario = new UsuarioEntity();
        usuario.setIdUsuario(7L);
        TipoDocumentoEntity tipoRuc = new TipoDocumentoEntity();
        tipoRuc.setIdTipoDocumento(4L);
        ConsultaRucResponse respuesta = respuestaRuc();

        when(usuarioRepository.findByCorreoIgnoreCaseAndEstadoTrue(CORREO))
                .thenReturn(Optional.of(usuario));
        when(consultaRucService.consultar(RUC)).thenReturn(respuesta);
        when(tipoDocumentoRepository.findByAbreviaturaIgnoreCaseAndEstadoTrue("RUC"))
                .thenReturn(Optional.of(tipoRuc));
        when(usuarioDocumentoRepository.findByTipoDocumentoIdTipoDocumentoAndNumeroDocumentoIgnoreCase(
                4L,
                RUC
        )).thenReturn(Optional.empty());
        when(usuarioDocumentoRepository.save(any(UsuarioDocumentoEntity.class)))
                .thenAnswer(invocacion -> invocacion.getArgument(0));
        when(usuarioDocumentoMapper.toResponse(any(UsuarioDocumentoEntity.class)))
                .thenReturn(new UsuarioDocumentoResponse(
                        12L,
                        4L,
                        "Registro Unico de Contribuyentes",
                        "RUC",
                        2L,
                        "Tributario",
                        RUC,
                        "PENDIENTE",
                        true,
                        null,
                        null
                ));

        UsuarioDocumentoResponse resultado = usuarioDocumentoService.registrarRucPendiente(
                CORREO,
                new RegistrarRucRequest(" 20123456789 ")
        );

        assertThat(resultado.numeroDocumento()).isEqualTo(RUC);
        verify(consultaRucService).consultar(RUC);
        verify(usuarioDocumentoRepository).save(any(UsuarioDocumentoEntity.class));
        verify(usuarioDocumentoMapper).toResponse(any(UsuarioDocumentoEntity.class));
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
