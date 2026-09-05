package com.regalia.backend.auth.infrastructure.ratelimit;

import com.regalia.backend.auth.application.LoginAttemptLimiter;
import com.regalia.backend.auth.application.LoginAttemptStatus;
import com.regalia.backend.auth.security.AuthContext;
import com.regalia.backend.shared.exception.DemasiadosIntentosLoginException;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * Limitador en memoria para proteger los endpoints de login contra fuerza bruta.
 */
@Component
public class InMemoryLoginAttemptLimiter implements LoginAttemptLimiter {

    private static final String IP_DESCONOCIDA = "unknown";

    private final LoginAttemptProperties properties;
    private final ConcurrentMap<AttemptKey, AttemptState> attempts = new ConcurrentHashMap<>();

    public InMemoryLoginAttemptLimiter(LoginAttemptProperties properties) {
        this.properties = properties;
    }

    @Override
    public void validarPermitido(AuthContext authContext, String correo, String ipCliente) {
        LoginAttemptProperties.Policy policy = properties.policyFor(authContext);
        Instant now = Instant.now();

        validarClave(identityKey(authContext, correo, ipCliente), policy.getPerIdentity(), now);
        validarClave(ipKey(authContext, ipCliente), policy.getPerIp(), now);
    }

    @Override
    public LoginAttemptStatus registrarFallo(AuthContext authContext, String correo, String ipCliente) {
        LoginAttemptProperties.Policy policy = properties.policyFor(authContext);
        Instant now = Instant.now();

        AttemptState estadoIdentidad = registrarFallo(
                identityKey(authContext, correo, ipCliente),
                policy.getPerIdentity(),
                now
        );
        AttemptState estadoIp = registrarFallo(ipKey(authContext, ipCliente), policy.getPerIp(), now);

        int intentosRestantes = Math.min(
                intentosRestantes(estadoIdentidad, policy.getPerIdentity()),
                intentosRestantes(estadoIp, policy.getPerIp())
        );
        Instant bloqueadoHasta = maxInstanteFuturo(
                estadoIdentidad.blockedUntil(),
                estadoIp.blockedUntil(),
                now
        );

        return LoginAttemptStatus.of(intentosRestantes, bloqueadoHasta, now);
    }

    @Override
    public void registrarExito(AuthContext authContext, String correo, String ipCliente) {
        attempts.remove(identityKey(authContext, correo, ipCliente));
    }

    private void validarClave(AttemptKey key, LoginAttemptProperties.Rule rule, Instant now) {
        AttemptState state = attempts.get(key);

        if (state == null) {
            return;
        }

        if (state.isBlocked(now)) {
            throw new DemasiadosIntentosLoginException(
                    LoginAttemptStatus.of(0, state.blockedUntil(), now)
            );
        }

        if (state.isBlockExpired(now) || state.isExpired(now, rule.windowDuration())) {
            attempts.remove(key, state);
        }
    }

    private AttemptState registrarFallo(AttemptKey key, LoginAttemptProperties.Rule rule, Instant now) {
        return attempts.compute(key, (ignored, currentState) -> {
            AttemptState state = currentState;

            if (state == null || state.isExpired(now, rule.windowDuration()) || state.isBlockExpired(now)) {
                state = AttemptState.empty();
            }

            int failedAttempts = state.failedAttempts() + 1;
            Instant blockedUntil = failedAttempts >= rule.getMaxFailedAttempts()
                    ? now.plus(rule.blockDuration())
                    : state.blockedUntil();

            return new AttemptState(failedAttempts, blockedUntil, now);
        });
    }

    private int intentosRestantes(AttemptState state, LoginAttemptProperties.Rule rule) {
        if (state.blockedUntil() != null) {
            return 0;
        }

        return Math.max(rule.getMaxFailedAttempts() - state.failedAttempts(), 0);
    }

    private Instant maxInstanteFuturo(Instant primero, Instant segundo, Instant ahora) {
        Instant maximo = null;
        if (primero != null && primero.isAfter(ahora)) {
            maximo = primero;
        }
        if (segundo != null && segundo.isAfter(ahora) && (maximo == null || segundo.isAfter(maximo))) {
            maximo = segundo;
        }
        return maximo;
    }

    private AttemptKey identityKey(AuthContext authContext, String correo, String ipCliente) {
        return new AttemptKey(
                authContext,
                AttemptScope.IDENTITY,
                normalizeEmail(correo),
                normalizeIp(ipCliente)
        );
    }

    private AttemptKey ipKey(AuthContext authContext, String ipCliente) {
        return new AttemptKey(
                authContext,
                AttemptScope.IP,
                null,
                normalizeIp(ipCliente)
        );
    }

    private String normalizeEmail(String correo) {
        return StringUtils.hasText(correo)
                ? correo.trim().toLowerCase(Locale.ROOT)
                : "";
    }

    private String normalizeIp(String ipCliente) {
        return StringUtils.hasText(ipCliente)
                ? ipCliente.trim()
                : IP_DESCONOCIDA;
    }

    private enum AttemptScope {
        IDENTITY,
        IP
    }

    private record AttemptKey(
            AuthContext authContext,
            AttemptScope scope,
            String correo,
            String ipCliente
    ) {
        private AttemptKey {
            Objects.requireNonNull(authContext, "authContext no puede ser null");
            Objects.requireNonNull(scope, "scope no puede ser null");
            Objects.requireNonNull(ipCliente, "ipCliente no puede ser null");
        }
    }

    private record AttemptState(
            int failedAttempts,
            Instant blockedUntil,
            Instant lastFailedAt
    ) {
        private static AttemptState empty() {
            return new AttemptState(0, null, null);
        }

        private boolean isBlocked(Instant now) {
            return blockedUntil != null && blockedUntil.isAfter(now);
        }

        private boolean isBlockExpired(Instant now) {
            return blockedUntil != null && !blockedUntil.isAfter(now);
        }

        private boolean isExpired(Instant now, Duration windowDuration) {
            return lastFailedAt != null && lastFailedAt.plus(windowDuration).isBefore(now);
        }
    }
}
