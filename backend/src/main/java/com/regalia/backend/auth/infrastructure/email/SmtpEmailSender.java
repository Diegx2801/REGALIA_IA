package com.regalia.backend.auth.infrastructure.email;

import com.regalia.backend.auth.application.email.EmailSender;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.io.UnsupportedEncodingException;
import java.nio.charset.StandardCharsets;

/**
 * Adaptador SMTP para correos transaccionales de REGALIA.
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
        enviarCorreo(
                destino,
                nombre,
                "Confirma tu correo en REGALIA",
                "Confirma tu correo",
                "Verifica que este correo te pertenece para habilitar pedidos, pagos y la gestion segura de tu cuenta.",
                "Confirmar correo",
                "Si no creaste una cuenta en REGALIA, puedes ignorar este mensaje.",
                enlaceConfirmacion
        );
    }

    @Override
    public void enviarRecuperacionContrasena(String destino, String nombre, String enlaceRestablecimiento) {
        enviarCorreo(
                destino,
                nombre,
                "Restablece tu contrasena en REGALIA",
                "Restablece tu contrasena",
                "Recibimos una solicitud para cambiar la contrasena de tu cuenta. Este enlace vence en 30 minutos.",
                "Crear nueva contrasena",
                "Si no solicitaste este cambio, puedes ignorar este mensaje. Tu contrasena actual no se modificara.",
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
        try {
            MimeMessage mensaje = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                    mensaje,
                    MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED,
                    StandardCharsets.UTF_8.name()
            );
            helper.setFrom(construirRemitente());
            helper.setTo(destino);
            helper.setSubject("Tu codigo de entrega de REGALIA");
            helper.setText(
                    construirContenidoTextoCodigoEntrega(nombre, idPedido, nombreTienda, codigoEntrega),
                    construirContenidoHtmlCodigoEntrega(nombre, idPedido, nombreTienda, codigoEntrega)
            );
            agregarLogoInline(helper);
            mailSender.send(mensaje);
        } catch (MessagingException | UnsupportedEncodingException | MailException ex) {
            throw new IllegalStateException("No se pudo enviar el codigo de entrega", ex);
        }
    }

    private void enviarCorreo(
            String destino,
            String nombre,
            String asunto,
            String titulo,
            String descripcion,
            String textoBoton,
            String avisoSeguridad,
            String enlace
    ) {
        try {
            MimeMessage mensaje = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                    mensaje,
                    MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED,
                    StandardCharsets.UTF_8.name()
            );

            helper.setFrom(construirRemitente());
            helper.setTo(destino);
            helper.setSubject(asunto);
            helper.setText(
                    construirContenidoTexto(nombre, descripcion, textoBoton, avisoSeguridad, enlace),
                    construirContenidoHtml(nombre, titulo, descripcion, textoBoton, avisoSeguridad, enlace)
            );
            agregarLogoInline(helper);

            mailSender.send(mensaje);
        } catch (MessagingException | UnsupportedEncodingException | MailException ex) {
            throw new IllegalStateException("No se pudo enviar el correo transaccional", ex);
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

    private String construirContenidoTexto(
            String nombre,
            String descripcion,
            String textoBoton,
            String avisoSeguridad,
            String enlace
    ) {
        String saludo = StringUtils.hasText(nombre) ? "Hola " + nombre.trim() + "," : "Hola,";

        return saludo + System.lineSeparator()
                + System.lineSeparator()
                + descripcion
                + System.lineSeparator()
                + System.lineSeparator()
                + textoBoton + ":"
                + System.lineSeparator()
                + enlace
                + System.lineSeparator()
                + System.lineSeparator()
                + avisoSeguridad;
    }

    private String construirContenidoHtml(
            String nombre,
            String titulo,
            String descripcion,
            String textoBoton,
            String avisoSeguridad,
            String enlace
    ) {
        String saludo = StringUtils.hasText(nombre) ? "Hola " + escapeHtml(nombre.trim()) + "," : "Hola,";
        String enlaceSeguro = escapeHtml(enlace);

        return """
                <!doctype html>
                <html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>%s</title></head>
                <body style="margin:0;padding:0;background:#f8f1ea;color:#20182a;font-family:Arial,Helvetica,sans-serif;">
                  <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="background:#f8f1ea;padding:32px 16px;"><tr><td align="center">
                    <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="width:100%%;max-width:560px;background:#fffaf6;border:1px solid #ead8cc;border-radius:18px;overflow:hidden;">
                      <tr><td style="padding:28px 32px 18px;background:#fffaf6;border-bottom:1px solid #ead8cc;">
                        <img src="cid:%s" width="168" alt="REGALIA" style="display:block;width:168px;max-width:100%%;height:auto;border:0;" />
                        <div style="margin-top:18px;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#8a5b0f;font-weight:700;">Seguridad de cuenta</div>
                        <h1 style="margin:12px 0 0;font-size:28px;line-height:1.15;color:#5b1f3f;">%s</h1>
                      </td></tr>
                      <tr><td style="padding:28px 32px 32px;">
                        <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#3b2d40;">%s</p>
                        <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#6f6074;">%s</p>
                        <p style="margin:0 0 28px;text-align:center;"><a href="%s" style="display:inline-block;background:#6b2248;color:#ffffff;text-decoration:none;font-weight:700;border-radius:999px;padding:14px 28px;font-size:15px;">%s</a></p>
                        <p style="margin:0 0 10px;font-size:13px;line-height:1.6;color:#7a6d7d;">Si el boton no funciona, copia y pega este enlace en tu navegador:</p>
                        <p style="margin:0 0 22px;font-size:13px;line-height:1.6;word-break:break-all;"><a href="%s" style="color:#6b2248;">%s</a></p>
                        <p style="margin:0;font-size:13px;line-height:1.6;color:#7a6d7d;">%s</p>
                      </td></tr>
                    </table>
                  </td></tr></table>
                </body></html>
                """.formatted(
                escapeHtml(titulo), LOGO_CONTENT_ID, escapeHtml(titulo), saludo, escapeHtml(descripcion),
                enlaceSeguro, escapeHtml(textoBoton), enlaceSeguro, enlaceSeguro, escapeHtml(avisoSeguridad)
        );
    }

    private String construirContenidoTextoCodigoEntrega(
            String nombre,
            Long idPedido,
            String nombreTienda,
            String codigoEntrega
    ) {
        String saludo = StringUtils.hasText(nombre) ? "Hola " + nombre.trim() + "," : "Hola,";
        return saludo + System.lineSeparator()
                + System.lineSeparator()
                + "Tu pedido #" + idPedido + " de " + nombreTienda + " esta listo para entregarse."
                + System.lineSeparator()
                + "Comparte este codigo solo cuando recibas tu pedido: " + codigoEntrega
                + System.lineSeparator()
                + System.lineSeparator()
                + "No compartas este codigo antes de recibir tu pedido.";
    }

    private String construirContenidoHtmlCodigoEntrega(
            String nombre,
            Long idPedido,
            String nombreTienda,
            String codigoEntrega
    ) {
        String saludo = StringUtils.hasText(nombre) ? "Hola " + escapeHtml(nombre.trim()) + "," : "Hola,";
        return """
                <!doctype html>
                <html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Codigo de entrega REGALIA</title></head>
                <body style="margin:0;padding:0;background:#f8f1ea;color:#20182a;font-family:Arial,Helvetica,sans-serif;">
                  <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="background:#f8f1ea;padding:32px 16px;"><tr><td align="center">
                    <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="width:100%%;max-width:560px;background:#fffaf6;border:1px solid #ead8cc;border-radius:18px;overflow:hidden;">
                      <tr><td style="padding:28px 32px 18px;background:#fffaf6;border-bottom:1px solid #ead8cc;"><img src="cid:%s" width="168" alt="REGALIA" style="display:block;width:168px;max-width:100%%;height:auto;border:0;" />
                        <div style="margin-top:18px;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#8a5b0f;font-weight:700;">Entrega de pedido</div>
                        <h1 style="margin:12px 0 0;font-size:28px;line-height:1.15;color:#5b1f3f;">Tu pedido esta listo</h1></td></tr>
                      <tr><td style="padding:28px 32px 32px;"><p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#3b2d40;">%s</p>
                        <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#6f6074;">El pedido <strong>#%s</strong> de <strong>%s</strong> ya puede entregarse.</p>
                        <div style="margin:0 0 22px;padding:18px;background:#f8f1ea;border:1px solid #ead8cc;border-radius:14px;text-align:center;"><div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#8a5b0f;font-weight:700;">Codigo de entrega</div><div style="margin-top:8px;font-size:32px;letter-spacing:8px;color:#5b1f3f;font-weight:800;">%s</div></div>
                        <p style="margin:0;font-size:13px;line-height:1.6;color:#7a6d7d;">Comparte este codigo solo cuando recibas tu pedido. No lo envíes antes de la entrega.</p>
                      </td></tr>
                    </table>
                  </td></tr></table>
                </body></html>
                """.formatted(LOGO_CONTENT_ID, saludo, idPedido, escapeHtml(nombreTienda), escapeHtml(codigoEntrega));
    }

    private void agregarLogoInline(MimeMessageHelper helper) throws MessagingException {
        ClassPathResource logo = new ClassPathResource(LOGO_RESOURCE_PATH);
        if (!logo.exists()) {
            throw new IllegalStateException("No se encontro el logo para el correo transaccional");
        }

        helper.addInline(LOGO_CONTENT_ID, logo, LOGO_CONTENT_TYPE);
    }

    private String escapeHtml(String valor) {
        return valor.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                .replace("\"", "&quot;").replace("'", "&#39;");
    }
}
