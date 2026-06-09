package com.regalia.backend.usuariorol.infrastructure.entity;

import com.regalia.backend.rol.infrastructure.entity.RolEntity;
import com.regalia.backend.usuario.infrastructure.entity.UsuarioEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Entidad JPA que representa la tabla usuario_rol.
 * Gestiona la asignación de roles a usuarios dentro del sistema.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "usuario_rol")
public class UsuarioRolEntity {

    @EmbeddedId
    private UsuarioRolId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("idUsuario")
    @JoinColumn(name = "id_usuario", nullable = false)
    private UsuarioEntity usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("idRol")
    @JoinColumn(name = "id_rol", nullable = false)
    private RolEntity rol;

    @Column(name = "estado", nullable = false)
    private Boolean estado = true;

    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    public UsuarioRolEntity(UsuarioEntity usuario, RolEntity rol) {
        this.usuario = usuario;
        this.rol = rol;
        this.id = new UsuarioRolId(usuario.getIdUsuario(), rol.getIdRol());
        this.estado = true;
    }

    /**
     * Asigna valores iniciales antes de insertar el registro.
     */
    @PrePersist
    public void prePersist() {
        this.fechaCreacion = LocalDateTime.now();

        if (this.estado == null) {
            this.estado = true;
        }
    }

    /**
     * Actualiza la fecha de modificación antes de guardar cambios.
     */
    @PreUpdate
    public void preUpdate() {
        this.fechaActualizacion = LocalDateTime.now();
    }
}