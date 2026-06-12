package com.regalia.backend.tipodocumento.infrastructure.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Entidad JPA que representa la tabla tipo_documento.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "tipo_documento")
public class TipoDocumentoEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_tipo_documento")
    private Long idTipoDocumento;

    @Column(name = "nombre", nullable = false, length = 80, unique = true)
    private String nombre;

    @Column(name = "abreviatura", nullable = false, length = 10, unique = true)
    private String abreviatura;

    @Column(name = "longitud_minima", nullable = false)
    private Integer longitudMinima;

    @Column(name = "longitud_maxima", nullable = false)
    private Integer longitudMaxima;

    @Column(name = "estado", nullable = false)
    private Boolean estado = true;

    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    @PrePersist
    public void prePersist() {
        this.fechaCreacion = LocalDateTime.now();

        if (this.estado == null) {
            this.estado = true;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.fechaActualizacion = LocalDateTime.now();
    }
}