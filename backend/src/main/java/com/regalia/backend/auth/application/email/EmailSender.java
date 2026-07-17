package com.regalia.backend.auth.application.email;

/**
 * Puerto de salida para enviar correos sin acoplar la aplicacion a SMTP, Gmail o un proveedor externo.
 */
public interface EmailSender {

    void enviarVerificacionCorreo(String destino, String nombre, String enlaceConfirmacion);

    void enviarRecuperacionContrasena(String destino, String nombre, String enlaceRestablecimiento);
}
