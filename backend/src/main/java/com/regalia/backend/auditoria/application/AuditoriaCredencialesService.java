package com.regalia.backend.auditoria.application;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * Agenda evidencia de cambios de credenciales solo despues de que su
 * transaccion de negocio se confirme. Un fallo de auditoria se registra en el
 * servidor, pero no revierte una contrasena ya confirmada.
 */
@Service
@RequiredArgsConstructor
public class AuditoriaCredencialesService {

    private static final Logger LOGGER = LoggerFactory.getLogger(AuditoriaCredencialesService.class);

    private final AuditoriaEventoService auditoriaEventoService;

    public void programarRecuperacionSolicitada(
            Long idUsuario,
            String correo,
            String ip,
            String userAgent
    ) {
        ejecutarDespuesDeCommit(() -> auditoriaEventoService.registrarRecuperacionContrasenaSolicitada(
                idUsuario,
                correo,
                ip,
                userAgent
        ));
    }

    public void programarRecuperacionCompletada(
            Long idUsuario,
            String correo,
            String ip,
            String userAgent
    ) {
        ejecutarDespuesDeCommit(() -> auditoriaEventoService.registrarRecuperacionContrasenaCompletada(
                idUsuario,
                correo,
                ip,
                userAgent
        ));
    }

    public void programarContrasenaCambiada(Long idUsuario, String correo, String ip, String userAgent) {
        ejecutarDespuesDeCommit(() -> auditoriaEventoService.registrarContrasenaCambiada(
                idUsuario,
                correo,
                ip,
                userAgent
        ));
    }

    private void ejecutarDespuesDeCommit(Runnable accionAuditoria) {
        Runnable accionSegura = () -> {
            try {
                accionAuditoria.run();
            } catch (RuntimeException exception) {
                LOGGER.error("No se pudo persistir un evento de auditoria de credenciales", exception);
            }
        };

        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            accionSegura.run();
            return;
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                accionSegura.run();
            }
        });
    }

}
