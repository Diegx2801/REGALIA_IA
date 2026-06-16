package com.regalia.backend.tienda.infrastructure.entity;

import com.regalia.backend.usuariodocumento.infrastructure.entity.UsuarioDocumentoEntity;
import com.regalia.backend.vendedor.infrastructure.entity.VendedorEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Entidad JPA que representa la tabla tienda.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "tienda")
public class TiendaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_tienda")
    private Long idTienda;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_vendedor", nullable = false)
    private VendedorEntity vendedor;

    @Column(name = "nombre", nullable = false, length = 150)
    private String nombre;

    @Column(name = "descripcion", columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "direccion_referencia", length = 255)
    private String direccionReferencia;

    @Column(name = "estado_revision", nullable = false, length = 30)
    private String estadoRevision = "PENDIENTE";

    @Column(name = "estado", nullable = false)
    private Boolean estado = true;

    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_documento_fiscal")
    private UsuarioDocumentoEntity documentoFiscal;

    @PrePersist
    public void prePersist() {
        this.fechaCreacion = LocalDateTime.now();

        if (this.estado == null) {
            this.estado = true;
        }

        if (this.estadoRevision == null || this.estadoRevision.isBlank()) {
            this.estadoRevision = "PENDIENTE";
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.fechaActualizacion = LocalDateTime.now();
    }
}