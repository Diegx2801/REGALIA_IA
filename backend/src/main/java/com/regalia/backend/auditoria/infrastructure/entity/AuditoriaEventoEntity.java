package com.regalia.backend.auditoria.infrastructure.entity;

import com.regalia.backend.auditoria.application.AuditoriaAccion;
import com.regalia.backend.auditoria.application.AuditoriaResultado;
import com.regalia.backend.auth.security.AuthContext;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "auditoria_evento")
public class AuditoriaEventoEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_auditoria_evento")
    private Long idAuditoriaEvento;

    @Column(name = "id_usuario_actor")
    private Long idUsuarioActor;

    @Enumerated(EnumType.STRING)
    @Column(name = "accion", nullable = false, length = 80)
    private AuditoriaAccion accion;

    @Enumerated(EnumType.STRING)
    @Column(name = "resultado", nullable = false, length = 30)
    private AuditoriaResultado resultado;

    @Enumerated(EnumType.STRING)
    @Column(name = "auth_context", length = 20)
    private AuthContext authContext;

    @Column(name = "correo_actor", length = 150)
    private String correoActor;

    @Column(name = "ip", length = 45)
    private String ip;

    @Column(name = "user_agent", length = 255)
    private String userAgent;

    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @PrePersist
    public void prePersist() {
        this.fechaCreacion = LocalDateTime.now();
    }
}
