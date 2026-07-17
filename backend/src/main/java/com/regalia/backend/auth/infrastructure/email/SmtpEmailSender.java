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
import org.springframework.core.io.ClassPathResource;
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

    private static final String LOGO_CONTENT_ID = "regalia-logo";
    private static final String LOGO_RESOURCE_PATH = "email/regalia-logo.png";
    private static final String LOGO_CONTENT_TYPE = "image/png";

    private final JavaMailSender mailSender;
    private final EmailSenderProperties properties;

    @Override
    public void enviarVerificacionCorreo(String destino, String nombre, String enlaceConfirmacion) {
        try {
            MimeMessage mensaje = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                    mensaje,
                    MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED,
                    StandardCharsets.UTF_8.name()
            );

            helper.setFrom(construirRemitente());
            helper.setTo(destino);
            helper.setSubject("Confirma tu correo en REGALIA");
            helper.setText(
                    construirContenidoTexto(nombre, enlaceConfirmacion),
                    construirContenidoHtml(nombre, enlaceConfirmacion)
            );
            agregarLogoInline(helper);

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
                + "Confirma tu correo para habilitar pedidos, pagos y la gestion segura de tu cuenta REGALIA."
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
                          <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="width:100%%;max-width:560px;background:#fffaf6;border:1px solid #ead8cc;border-radius:18px;overflow:hidden;">
                            <tr>
                              <td style="padding:28px 32px 18px 32px;background:#fffaf6;border-bottom:1px solid #ead8cc;">
                                <img src="cid:%s" width="168" alt="REGALIA" style="display:block;width:168px;max-width:100%%;height:auto;border:0;outline:none;text-decoration:none;" />
                                <div style="margin-top:18px;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#8a5b0f;font-weight:700;">Seguridad de cuenta</div>
                                <h1 style="margin:12px 0 0 0;font-size:28px;line-height:1.15;color:#5b1f3f;">Confirma tu correo</h1>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:28px 32px 32px 32px;">
                                <p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;color:#3b2d40;">%s</p>
                                <p style="margin:0 0 24px 0;font-size:16px;line-height:1.6;color:#6f6074;">
                                  Verifica que este correo te pertenece para habilitar pedidos, pagos y la gestion segura de tu cuenta.
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
                """.formatted(LOGO_CONTENT_ID, saludo, enlaceSeguro, enlaceSeguro, enlaceSeguro);
    }

    private void agregarLogoInline(MimeMessageHelper helper) throws MessagingException {
        ClassPathResource logo = new ClassPathResource(LOGO_RESOURCE_PATH);

        if (!logo.exists()) {
            throw new IllegalStateException("No se encontro el logo para el correo transaccional");
        }

        helper.addInline(LOGO_CONTENT_ID, logo, LOGO_CONTENT_TYPE);
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
