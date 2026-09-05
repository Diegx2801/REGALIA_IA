package com.regalia.backend.auth.application;

import java.time.Duration;
import java.time.Instant;

/**
 * Estado seguro para informar al cliente el resultado del control de intentos.
 * No contiene datos que permitan confirmar si una cuenta existe.
 */
public record LoginAttemptStatus(
        int intentosRestantes,
        Instant bloqueadoHasta,
        long reintentarEnSegundos
) {

    public static LoginAttemptStatus of(int intentosRestantes, Instant bloqueadoHasta, Instant ahora) {
        int restantes = Math.max(intentosRestantes, 0);
        long segundos = bloqueadoHasta == null
                ? 0
                : Math.max(0, (long) Math.ceil(Duration.between(ahora, bloqueadoHasta).toMillis() / 1000.0));

        return new LoginAttemptStatus(restantes, bloqueadoHasta, segundos);
    }

    public boolean estaBloqueado() {
        return reintentarEnSegundos > 0;
    }
}
