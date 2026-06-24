package com.regalia.backend.shared.web;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * Resuelve la IP remota usada por controles de seguridad de la API.
 */
@Component
public class ClientIpResolver {

    private static final String IP_DESCONOCIDA = "unknown";
    private static final String HEADER_USER_AGENT = "User-Agent";

    public String resolve(HttpServletRequest request) {
        if (request == null || !StringUtils.hasText(request.getRemoteAddr())) {
            return IP_DESCONOCIDA;
        }

        // No confiar directamente en X-Forwarded-For sin un proxy configurado.
        return request.getRemoteAddr();
    }

    public String resolveUserAgent(HttpServletRequest request) {
        if (request == null || !StringUtils.hasText(request.getHeader(HEADER_USER_AGENT))) {
            return null;
        }

        return request.getHeader(HEADER_USER_AGENT);
    }
}
