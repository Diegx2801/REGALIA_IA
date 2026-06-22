package com.regalia.backend.auditoria.application;

import com.regalia.backend.auditoria.infrastructure.entity.AuditoriaEventoEntity;
import com.regalia.backend.auditoria.infrastructure.repository.AuditoriaEventoJpaRepository;
import com.regalia.backend.auth.security.AuthContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AuditoriaEventoService {

    private static final int MAX_CORREO_LENGTH = 150;
    private static final int MAX_IP_LENGTH = 45;
    private static final int MAX_USER_AGENT_LENGTH = 255;

    private final AuditoriaEventoJpaRepository auditoriaEventoRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void registrarLoginExitoso(
            AuthContext authContext,
            Long idUsuarioActor,
            String correoActor,
            String ip,
            String userAgent
    ) {
        AuditoriaAccion accion = AuthContext.ADMIN.equals(authContext)
                ? AuditoriaAccion.LOGIN_ADMIN_EXITOSO
                : AuditoriaAccion.LOGIN_PUBLICO_EXITOSO;

        registrar(
                accion,
                AuditoriaResultado.EXITOSO,
                authContext,
                idUsuarioActor,
                correoActor,
                ip,
                userAgent
        );
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void registrarLoginAdminFallido(
            Long idUsuarioActor,
            String correoActor,
            String ip,
            String userAgent
    ) {
        registrar(
                AuditoriaAccion.LOGIN_ADMIN_FALLIDO,
                AuditoriaResultado.FALLIDO,
                AuthContext.ADMIN,
                idUsuarioActor,
                correoActor,
                ip,
                userAgent
        );
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void registrarLoginLimitado(
            AuthContext authContext,
            Long idUsuarioActor,
            String correoActor,
            String ip,
            String userAgent
    ) {
        AuditoriaAccion accion = AuthContext.ADMIN.equals(authContext)
                ? AuditoriaAccion.LOGIN_ADMIN_LIMITADO
                : AuditoriaAccion.LOGIN_PUBLICO_LIMITADO;

        registrar(
                accion,
                AuditoriaResultado.LIMITADO,
                authContext,
                idUsuarioActor,
                correoActor,
                ip,
                userAgent
        );
    }

    private void registrar(
            AuditoriaAccion accion,
            AuditoriaResultado resultado,
            AuthContext authContext,
            Long idUsuarioActor,
            String correoActor,
            String ip,
            String userAgent
    ) {
        AuditoriaEventoEntity evento = new AuditoriaEventoEntity();
        evento.setAccion(accion);
        evento.setResultado(resultado);
        evento.setAuthContext(authContext);
        evento.setIdUsuarioActor(idUsuarioActor);
        evento.setCorreoActor(normalizarCorreo(correoActor));
        evento.setIp(normalizarTexto(ip, MAX_IP_LENGTH));
        evento.setUserAgent(normalizarTexto(userAgent, MAX_USER_AGENT_LENGTH));

        auditoriaEventoRepository.save(evento);
    }

    private String normalizarCorreo(String correo) {
        String valor = normalizarTexto(correo, MAX_CORREO_LENGTH);

        return valor == null ? null : valor.toLowerCase(Locale.ROOT);
    }

    private String normalizarTexto(String texto, int maxLength) {
        if (!StringUtils.hasText(texto)) {
            return null;
        }

        String valor = texto.trim();

        if (valor.length() <= maxLength) {
            return valor;
        }

        return valor.substring(0, maxLength);
    }
}
