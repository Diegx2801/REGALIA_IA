package com.regalia.backend.auth.infrastructure.email;

import com.regalia.backend.auth.application.email.EmailSender;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.io.UnsupportedEncodingException;
import java.nio.charset.StandardCharsets;

/**
 * Adaptador SMTP para correos transaccionales.
 */
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "regalia.email", name = "provider", havingValue = "SMTP")
public class SmtpEmailSender implements EmailSender {

    private final JavaMailSender mailSender;
    private final EmailSenderProperties properties;

    @Override
    public void enviarVerificacionCorreo(String destino, String nombre, String enlaceConfirmacion) {
        try {
            MimeMessage mensaje = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                    mensaje,
                    false,
                    StandardCharsets.UTF_8.name()
            );

            helper.setFrom(construirRemitente());
            helper.setTo(destino);
            helper.setSubject("Confirma tu correo en REGALIA");
            helper.setText(
                    construirContenidoTexto(nombre, enlaceConfirmacion),
                    construirContenidoHtml(nombre, enlaceConfirmacion)
            );

            mailSender.send(mensaje);
        } catch (MessagingException | UnsupportedEncodingException | MailException ex) {
            throw new IllegalStateException("No se pudo enviar el correo de verificacion", ex);
        }
    }

    private InternetAddress construirRemitente() throws UnsupportedEncodingException {
        if (!StringUtils.hasText(properties.getFromAddress())) {
            throw new IllegalStateException("El remitente SMTP de REGALIA es obligatorio");
        }

        String nombre = StringUtils.hasText(properties.getFromName())
                ? properties.getFromName().trim()
                : "REGALIA";

        return new InternetAddress(properties.getFromAddress().trim(), nombre, StandardCharsets.UTF_8.name());
    }

    private String construirContenidoTexto(String nombre, String enlaceConfirmacion) {
        String saludo = StringUtils.hasText(nombre) ? "Hola " + nombre.trim() + "," : "Hola,";

        return saludo + System.lineSeparator()
                + System.lineSeparator()
                + "Confirma tu correo para activar las notificaciones y proteger tu cuenta REGALIA."
                + System.lineSeparator()
                + System.lineSeparator()
                + "Abre este enlace para confirmar tu correo:"
                + System.lineSeparator()
                + enlaceConfirmacion
                + System.lineSeparator()
                + System.lineSeparator()
                + "Si no creaste una cuenta en REGALIA, puedes ignorar este mensaje.";
    }

    private String construirContenidoHtml(String nombre, String enlaceConfirmacion) {
        String saludo = StringUtils.hasText(nombre) ? "Hola " + escapeHtml(nombre.trim()) + "," : "Hola,";
        String enlaceSeguro = escapeHtml(enlaceConfirmacion);

        return """
                <!doctype html>
                <html lang="es">
                  <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Confirma tu correo en REGALIA</title>
                  </head>
                  <body style="margin:0;padding:0;background:#f8f1ea;color:#20182a;font-family:Arial,Helvetica,sans-serif;">
                    <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="background:#f8f1ea;padding:32px 16px;">
                      <tr>
                        <td align="center">
                          <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fffaf6;border:1px solid #ead8cc;border-radius:18px;overflow:hidden;">
                            <tr>
                              <td style="padding:28px 32px 18px 32px;background:#5b1f3f;color:#ffffff;">
                                <div style="font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#f2c14e;font-weight:700;">REGALIA</div>
                                <h1 style="margin:12px 0 0 0;font-size:28px;line-height:1.15;color:#ffffff;">Confirma tu correo</h1>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:28px 32px 32px 32px;">
                                <p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;color:#3b2d40;">%s</p>
                                <p style="margin:0 0 24px 0;font-size:16px;line-height:1.6;color:#6f6074;">
                                  Activa tu cuenta para proteger tu acceso y recibir notificaciones importantes sobre tus reservas.
                                </p>
                                <p style="margin:0 0 28px 0;text-align:center;">
                                  <a href="%s" style="display:inline-block;background:#6b2248;color:#ffffff;text-decoration:none;font-weight:700;border-radius:999px;padding:14px 28px;font-size:15px;">
                                    Confirmar correo
                                  </a>
                                </p>
                                <p style="margin:0 0 10px 0;font-size:13px;line-height:1.6;color:#7a6d7d;">
                                  Si el boton no funciona, copia y pega este enlace en tu navegador:
                                </p>
                                <p style="margin:0 0 22px 0;font-size:13px;line-height:1.6;word-break:break-all;">
                                  <a href="%s" style="color:#6b2248;">%s</a>
                                </p>
                                <p style="margin:0;font-size:13px;line-height:1.6;color:#7a6d7d;">
                                  Si no creaste una cuenta en REGALIA, puedes ignorar este mensaje.
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </body>
                </html>
                """.formatted(saludo, enlaceSeguro, enlaceSeguro, enlaceSeguro);
    }

    private String escapeHtml(String valor) {
        return valor
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
