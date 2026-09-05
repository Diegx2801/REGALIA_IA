package com.regalia.backend.auth.infrastructure.ratelimit;

import com.regalia.backend.auth.application.LoginAttemptStatus;
import com.regalia.backend.auth.security.AuthContext;
import com.regalia.backend.shared.exception.DemasiadosIntentosLoginException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class InMemoryLoginAttemptLimiterTest {

    @Test
    void informaIntentosRestantesYBloqueoTemporal() {
        LoginAttemptProperties properties = new LoginAttemptProperties();
        properties.setPublicLogin(new LoginAttemptProperties.Policy(
                new LoginAttemptProperties.Rule(3, 10, 1),
                new LoginAttemptProperties.Rule(20, 10, 1)
        ));
        InMemoryLoginAttemptLimiter limiter = new InMemoryLoginAttemptLimiter(properties);

        LoginAttemptStatus primerFallo = limiter.registrarFallo(AuthContext.PUBLIC, "cliente@regalia.test", "127.0.0.1");
        LoginAttemptStatus segundoFallo = limiter.registrarFallo(AuthContext.PUBLIC, "cliente@regalia.test", "127.0.0.1");
        LoginAttemptStatus tercerFallo = limiter.registrarFallo(AuthContext.PUBLIC, "cliente@regalia.test", "127.0.0.1");

        assertEquals(2, primerFallo.intentosRestantes());
        assertEquals(1, segundoFallo.intentosRestantes());
        assertTrue(tercerFallo.estaBloqueado());
        assertTrue(tercerFallo.reintentarEnSegundos() > 0);

        DemasiadosIntentosLoginException excepcion = assertThrows(
                DemasiadosIntentosLoginException.class,
                () -> limiter.validarPermitido(AuthContext.PUBLIC, "cliente@regalia.test", "127.0.0.1")
        );
        assertTrue(excepcion.getEstadoIntentos().estaBloqueado());
    }
}
