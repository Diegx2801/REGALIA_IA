package com.regalia.backend.usuarioidentidad.infrastructure.entity;

import com.regalia.backend.usuario.infrastructure.entity.UsuarioEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Identidad externa vinculada a una cuenta REGALIA.
 * Permite soportar SSO sin acoplar usuario a un proveedor especifico.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "usuario_identidad")
public class UsuarioIdentidadEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_usuario_identidad")
    private Long idUsuarioIdentidad;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_usuario", nullable = false)
    private UsuarioEntity usuario;

    @Column(name = "proveedor", nullable = false, length = 30)
    private String proveedor;

    @Column(name = "proveedor_subject", nullable = false, length = 255)
    private String proveedorSubject;

    @Column(name = "correo_proveedor", nullable = false, length = 150)
    private String correoProveedor;

    @Column(name = "correo_verificado", nullable = false)
    private Boolean correoVerificado = false;

    @Column(name = "estado", nullable = false)
    private Boolean estado = true;

    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    @PrePersist
    void prePersist() {
        this.fechaCreacion = LocalDateTime.now();

        if (this.correoVerificado == null) {
            this.correoVerificado = false;
        }

        if (this.estado == null) {
            this.estado = true;
        }
    }

    @PreUpdate
    void preUpdate() {
        this.fechaActualizacion = LocalDateTime.now();
    }
}
