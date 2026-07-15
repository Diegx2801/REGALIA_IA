package com.regalia.backend.auth.infrastructure.entity;

import com.regalia.backend.auth.application.UsuarioTokenSeguridadTipo;
import com.regalia.backend.usuario.infrastructure.entity.UsuarioEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Token de seguridad de usuario guardado de forma hasheada.
 * Soporta verificacion de correo, recuperacion de contrasena y cambio de correo.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "usuario_token_seguridad")
public class UsuarioTokenSeguridadEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_usuario_token_seguridad")
    private Long idUsuarioTokenSeguridad;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_usuario", nullable = false)
    private UsuarioEntity usuario;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_token", nullable = false, length = 40)
    private UsuarioTokenSeguridadTipo tipoToken;

    @Column(name = "token_hash", nullable = false, length = 255)
    private String tokenHash;

    @Column(name = "fecha_expiracion", nullable = false)
    private LocalDateTime fechaExpiracion;

    @Column(name = "fecha_consumo")
    private LocalDateTime fechaConsumo;

    @Column(name = "intentos", nullable = false)
    private Integer intentos = 0;

    @Column(name = "estado", nullable = false)
    private Boolean estado = true;

    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    @PrePersist
    public void prePersist() {
        this.fechaCreacion = LocalDateTime.now();

        if (this.intentos == null) {
            this.intentos = 0;
        }

        if (this.estado == null) {
            this.estado = true;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.fechaActualizacion = LocalDateTime.now();
    }
}
