package com.regalia.backend.auth.application.email;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Ejecuta el envio de correos fuera del request para mantener fluida la experiencia del usuario.
 */
@Service
@RequiredArgsConstructor
public class EmailDeliveryService {

    private static final Logger LOGGER = LoggerFactory.getLogger(EmailDeliveryService.class);

    private final EmailSender emailSender;

    @Async("emailTaskExecutor")
    public void enviarVerificacionCorreo(String destino, String nombre, String enlaceConfirmacion) {
        try {
            emailSender.enviarVerificacionCorreo(destino, nombre, enlaceConfirmacion);
        } catch (RuntimeException exception) {
            LOGGER.error(
                    "No se pudo enviar el correo de verificacion. exceptionType={}",
                    exception.getClass().getSimpleName()
            );
        }
    }

    @Async("emailTaskExecutor")
    public void enviarRecuperacionContrasena(String destino, String nombre, String enlaceRestablecimiento) {
        try {
            emailSender.enviarRecuperacionContrasena(destino, nombre, enlaceRestablecimiento);
        } catch (RuntimeException exception) {
            LOGGER.error(
                    "No se pudo enviar el correo de recuperacion de contrasena. exceptionType={}",
                    exception.getClass().getSimpleName()
            );
        }
    }

    @Async("emailTaskExecutor")
    public void enviarCodigoEntrega(
            String destino,
            String nombre,
            Long idPedido,
            String nombreTienda,
            String codigoEntrega
    ) {
        try {
            emailSender.enviarCodigoEntrega(destino, nombre, idPedido, nombreTienda, codigoEntrega);
        } catch (RuntimeException exception) {
            LOGGER.error(
                    "No se pudo enviar el codigo de entrega. exceptionType={}",
                    exception.getClass().getSimpleName()
            );
        }
    }
}
