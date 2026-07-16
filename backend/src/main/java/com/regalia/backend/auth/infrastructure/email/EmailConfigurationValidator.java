package com.regalia.backend.auth.infrastructure.email;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.mail.MailProperties;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import jakarta.annotation.PostConstruct;
import java.util.Locale;

/**
 * Evita que produccion inicie con un proveedor de desarrollo o con SMTP
 * incompleto. No valida conectividad: eso debe ser responsabilidad de health
 * checks y del proveedor de correo.
 */
@Component
@RequiredArgsConstructor
public class EmailConfigurationValidator {

    private final EmailSenderProperties emailProperties;
    private final EmailVerificationProperties verificationProperties;
    private final MailProperties mailProperties;
    private final Environment environment;

    @PostConstruct
    void validate() {
        String provider = emailProperties.getProvider() == null
                ? ""
                : emailProperties.getProvider().trim().toUpperCase(Locale.ROOT);

        if (!"LOG".equals(provider) && !"SMTP".equals(provider)) {
            throw new IllegalStateException("regalia.email.provider debe ser LOG o SMTP");
        }

        if ("SMTP".equals(provider)) {
            validarSmtp();
        }

        if (isProduction()) {
            if (!"SMTP".equals(provider)) {
                throw new IllegalStateException("Produccion requiere regalia.email.provider=SMTP");
            }

            if (!verificationProperties.getConfirmationUrl().trim().toLowerCase(Locale.ROOT).startsWith("https://")) {
                throw new IllegalStateException("Produccion requiere una URL HTTPS para confirmar correos");
            }
        }
    }

    private void validarSmtp() {
        if (!StringUtils.hasText(mailProperties.getHost()) || !StringUtils.hasText(emailProperties.getFromAddress())) {
            throw new IllegalStateException("SMTP requiere host y regalia.email.from-address");
        }

        boolean requiereAutenticacion = Boolean.parseBoolean(
                String.valueOf(mailProperties.getProperties().getOrDefault("mail.smtp.auth", "true"))
        );

        if (requiereAutenticacion
                && (!StringUtils.hasText(mailProperties.getUsername()) || !StringUtils.hasText(mailProperties.getPassword()))) {
            throw new IllegalStateException("SMTP autenticado requiere usuario y contrasena");
        }
    }

    private boolean isProduction() {
        return environment.acceptsProfiles(Profiles.of("prod", "production"));
    }
}
