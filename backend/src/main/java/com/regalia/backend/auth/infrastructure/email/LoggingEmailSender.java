package com.regalia.backend.auth.infrastructure.email;

import com.regalia.backend.auth.application.email.EmailSender;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Implementacion local para desarrollo.
 * En produccion se reemplaza por SMTP o un proveedor transaccional sin cambiar la capa de aplicacion.
 */
@Component
@ConditionalOnProperty(prefix = "regalia.email", name = "provider", havingValue = "LOG", matchIfMissing = true)
public class LoggingEmailSender implements EmailSender {

    private static final Logger LOGGER = LoggerFactory.getLogger(LoggingEmailSender.class);

    @Override
    public void enviarVerificacionCorreo(String destino, String nombre, String enlaceConfirmacion) {
        LOGGER.info(
                "Verificacion de correo REGALIA para {} <{}>: {}",
                nombre,
                destino,
                enlaceConfirmacion
        );
    }

    @Override
    public void enviarRecuperacionContrasena(String destino, String nombre, String enlaceRestablecimiento) {
        LOGGER.info(
                "Recuperacion de contrasena REGALIA para {} <{}>: {}",
                nombre,
                destino,
                enlaceRestablecimiento
        );
    }

    @Override
    public void enviarCodigoEntrega(
            String destino,
            String nombre,
            Long idPedido,
            String nombreTienda,
            String codigoEntrega
    ) {
        LOGGER.info(
                "Codigo de entrega REGALIA del pedido {} para {} <{}>: {}",
                idPedido,
                nombre,
                destino,
                codigoEntrega
        );
    }
}
